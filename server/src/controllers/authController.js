const User = require("../models/userModel");
const generateToken = require("../utils/generateToken");

// Cookie options
const cookieOptions = {
  httpOnly: true, 
  secure: process.env.NODE_ENV === "production", 
  sameSite: "strict", 
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

// Register User
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new user
    const user = await User.create({ name, email, password, role });

    // Generate token
    const token = generateToken(user._id);

    // Send response with cookie
    res
      .cookie("token", token, cookieOptions)
      .status(201)
      .json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login User
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    // console.log(req.body);
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email " });
    }
    // console.log("currentPassword:", password);
    // console.log("user.password (hashed):", user.password);
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "password" });
    }
    const token = generateToken(user._id);

    res
      .cookie("token", token, cookieOptions)
      .json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Logout User
const logoutUser = (req, res) => {
  res
    .cookie("token", "", { httpOnly: true, expires: new Date(0) })
    .json({ message: "Logged out successfully" });
};

const getMe = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authorized" });
  }

  res.json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role
  });
};

module.exports = {
  loginUser,
  logoutUser,
  registerUser,
  getMe
};