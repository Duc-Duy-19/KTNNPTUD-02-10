var express = require("express");
var router = express.Router();
const Role = require("../schemas/role");

router.get("/", async function (req, res, next) {
  try {
    const roles = await Role.find({ isDelete: false }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      message: "Get all roles successfully",
      data: roles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error getting roles",
      error: error.message,
    });
  }
});

router.get("/:id", async function (req, res, next) {
  try {
    const { id } = req.params;
    const role = await Role.findOne({ _id: id, isDelete: false });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Get role successfully",
      data: role,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error getting role",
      error: error.message,
    });
  }
});

router.post("/", async function (req, res, next) {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Role name is required",
      });
    }

    const newRole = new Role({
      name,
      description: description || "",
    });

    const savedRole = await newRole.save();

    res.status(201).json({
      success: true,
      message: "Role created successfully",
      data: savedRole,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Role name already exists",
      });
    }
    res.status(500).json({
      success: false,
      message: "Error creating role",
      error: error.message,
    });
  }
});

router.put("/:id", async function (req, res, next) {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const role = await Role.findOne({ _id: id, isDelete: false });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    const updatedRole = await Role.findByIdAndUpdate(
      id,
      {
        name: name || role.name,
        description: description !== undefined ? description : role.description,
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Role updated successfully",
      data: updatedRole,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Role name already exists",
      });
    }
    res.status(500).json({
      success: false,
      message: "Error updating role",
      error: error.message,
    });
  }
});

router.delete("/:id", async function (req, res, next) {
  try {
    const { id } = req.params;

    const role = await Role.findOne({ _id: id, isDelete: false });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    await Role.findByIdAndUpdate(id, { isDelete: true });

    res.status(200).json({
      success: true,
      message: "Role deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting role",
      error: error.message,
    });
  }
});

module.exports = router;
