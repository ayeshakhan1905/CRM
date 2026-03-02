const User = require("../models/userModel");
const generateToken = require("../utils/generateToken");
const { sendTemplate } = require('../services/emailService');

// Cookie options
const cookieOptions = {
  httpOnly: true, 
  secure: process.env.NODE_ENV === "production", 
  sameSite: "strict", 
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

// Register User
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new user
    const user = await User.create({ name, email, password, role });

    // send welcome email if template exists (silent failures)
    try {
      // look up a template named "Welcome" or by id stored in env
      if (process.env.WELCOME_TEMPLATE_ID) {
        await sendTemplate({
          templateId: process.env.WELCOME_TEMPLATE_ID,
          to: user.email,
          variables: { name: user.name }
        });
      }
    } catch (err) {
      console.error('Failed to send welcome email:', err.message);
    }

    // Generate token
    const token = generateToken(user._id);

    // Send response with cookie
    res
      .cookie("token", token, cookieOptions)
      .status(201)
      .json({
        token, // include token in response for API clients
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      });

  } catch (error) {
    next(error);
  }
};

// Login User
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    // console.log(req.body);
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Incorrect email or Password" });
    }
    // console.log("currentPassword:", password);
    // console.log("user.password (hashed):", user.password);
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect email or Password" });
    }
    const token = generateToken(user._id);

    res
      .cookie("token", token, cookieOptions)
      .json({
        token, // include token in response for API clients
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      });

  } catch (error) {
    next(error);
  }
};

// Logout User
const logoutUser = (req, res) => {
  res
    .cookie("token", "", { httpOnly: true, expires: new Date(0) })
    .json({ message: "Logged out successfully" });
};

const getMe = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    res.json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loginUser,
  logoutUser,
  registerUser,
  getMe
};