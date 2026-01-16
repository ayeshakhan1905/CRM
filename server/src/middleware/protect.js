const jwt = require("jsonwebtoken")
const User = require("../models/userModel")

const protect = async (req, res, next) => {
  let token = req.cookies.token; // Read token from cookie
  // console.log(token);
  
  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    console.log("protect");
    next();
  } catch (error) {
    return res.status(401).json({ message: error.message });
  }
};

module.exports = protect