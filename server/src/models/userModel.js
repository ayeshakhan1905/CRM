const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"]
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true
  },
  password: {
    type: String,
    required: [true, "Password is required"]
  },
  role: { 
    type: String, 
    enum: ['admin', 'sales'], 
    default: 'sales' 
  },
  profileImage: String,
  active: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (password) {
  // console.log("Plain password:", password);
  // console.log("Hashed password:", this.password);
  let updated = await bcrypt.compare(password, this.password);
  // console.log(updated);
  return updated
};

module.exports = mongoose.model("User", userSchema);