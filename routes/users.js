var express = require("express");
var router = express.Router();
const User = require("../schemas/user");
const Role = require("../schemas/role");

router.get("/", async function (req, res, next) {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    let query = { isDelete: false };

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { fullName: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .populate("role", "name description")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      message: "Get all users successfully",
      data: users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error getting users",
      error: error.message,
    });
  }
});

router.get("/:id", async function (req, res, next) {
  try {
    const { id } = req.params;
    const user = await User.findOne({ _id: id, isDelete: false }).populate(
      "role",
      "name description"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Get user successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error getting user",
      error: error.message,
    });
  }
});

router.get("/username/:username", async function (req, res, next) {
  try {
    const { username } = req.params;
    const user = await User.findOne({
      username: username,
      isDelete: false,
    }).populate("role", "name description");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Get user successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error getting user",
      error: error.message,
    });
  }
});

router.post("/", async function (req, res, next) {
  try {
    const { username, password, email, fullName, avatarUrl, role } = req.body;

    if (!username || !password || !email || !role) {
      return res.status(400).json({
        success: false,
        message: "Username, password, email, and role are required",
      });
    }

    const roleExists = await Role.findOne({ _id: role, isDelete: false });
    if (!roleExists) {
      return res.status(400).json({
        success: false,
        message: "Role not found",
      });
    }

    const newUser = new User({
      username,
      password,
      email,
      fullName: fullName || "",
      avatarUrl: avatarUrl || "",
      role,
    });

    const savedUser = await newUser.save();
    const populatedUser = await User.findById(savedUser._id).populate(
      "role",
      "name description"
    );

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: populatedUser,
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`,
      });
    }
    res.status(500).json({
      success: false,
      message: "Error creating user",
      error: error.message,
    });
  }
});

router.post("/activate", async function (req, res, next) {
  try {
    const { email, username } = req.body;

    if (!email || !username) {
      return res.status(400).json({
        success: false,
        message: "Email and username are required",
      });
    }

    const user = await User.findOne({
      email: email,
      username: username,
      isDelete: false,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found or invalid credentials",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        status: true,
        $inc: { loginCount: 1 },
      },
      { new: true }
    ).populate("role", "name description");

    res.status(200).json({
      success: true,
      message: "User activated successfully",
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error activating user",
      error: error.message,
    });
  }
});

router.put("/:id", async function (req, res, next) {
  try {
    const { id } = req.params;
    const { username, password, email, fullName, avatarUrl, role } = req.body;

    const user = await User.findOne({ _id: id, isDelete: false });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (role) {
      const roleExists = await Role.findOne({ _id: role, isDelete: false });
      if (!roleExists) {
        return res.status(400).json({
          success: false,
          message: "Role not found",
        });
      }
    }

    const updateData = {};
    if (username) updateData.username = username;
    if (password) updateData.password = password;
    if (email) updateData.email = email;
    if (fullName !== undefined) updateData.fullName = fullName;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (role) updateData.role = role;

    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("role", "name description");

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`,
      });
    }
    res.status(500).json({
      success: false,
      message: "Error updating user",
      error: error.message,
    });
  }
});

router.delete("/:id", async function (req, res, next) {
  try {
    const { id } = req.params;

    const user = await User.findOne({ _id: id, isDelete: false });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await User.findByIdAndUpdate(id, { isDelete: true });

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting user",
      error: error.message,
    });
  }
});

module.exports = router;
