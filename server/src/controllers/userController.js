const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const path = require("path");
const fs = require("fs");

// ✅ Get all users (Admin only)
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Get single user (Admin or Owner)
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Add new user (Admin only)
const addUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    console.log(req.body);

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "User already exists" });

    const newUser = await User.create({
      name,
      email,
      password,  // <--- just send plain password
      role: role || "user",
    });

    console.log(newUser);
    res.status(201).json({
      message: "User created successfully",
      user: { _id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Update user (Admin or Owner via checkOwnership)
const updateUser = async (req, res) => {
  try {
    // console.log("Update route hit");
    const { name, email, password, role } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    user.name = name || user.name;
    user.email = email || user.email;
    if (password) user.password = await bcrypt.hash(password, 10);
    if (req.user.role === "admin" && role) user.role = role; // only admin can change role

    await user.save();

    res.json({ message: "User updated", user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

  const changePassword = async (req, res) => {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;
      // console.log("change route hit");

      // console.log("req.body:", req.body);   // 👈 add this to see exactly what frontend sends
      // console.log("req.user:", req.user);
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: "All fields are required" });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: "New password and confirm password do not match" });
      }

      const user = await User.findById(req.user._id);
      if (!user) return res.status(404).json({ message: "User not found" });

      // check old password
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) return res.status(400).json({ message: "Current password is incorrect" });

      user.password = newPassword
      await user.save();

      res.json({ message: "Password updated successfully" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };

// ✅ Delete user (Admin or Owner via checkOwnership)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Upload profile picture
const uploadProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Update profile image URL
    user.profileImage = req.imageUrl;
    await user.save();

    res.json({
      message: "Profile picture updated successfully",
      profileImage: user.profileImage
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Delete profile picture
const deleteProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.profileImage = null;
    await user.save();

    res.json({ message: "Profile picture removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getUsers, getUserById, addUser, updateUser, deleteUser, changePassword, uploadProfilePicture, deleteProfilePicture };