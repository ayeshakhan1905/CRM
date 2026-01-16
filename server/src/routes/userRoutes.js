const { getUsers, addUser, getUserById, updateUser, deleteUser, changePassword, uploadProfilePicture, deleteProfilePicture } = require("../controllers/userController");
const authorize = require("../middleware/authorize");
const checkOwnership = require("../middleware/checkOwnership");
const protect = require("../middleware/protect");
const { upload, uploadToImageKit } = require("../middleware/upload");
const User = require("../models/userModel");

const router = require("express").Router()

router.get("/", protect, authorize(['admin']), getUsers);
router.post("/", protect, authorize(['admin']), addUser);
router.patch("/change-password", protect, changePassword);

// Profile picture routes
router.post("/upload-profile-picture", protect, upload.single('profileImage'), uploadToImageKit, uploadProfilePicture);
router.delete("/profile-picture", protect, deleteProfilePicture);

// Admin or Owner
router.get("/:id", protect, checkOwnership(User), getUserById);
router.put("/:id", protect, checkOwnership(User), updateUser);
router.delete("/:id", protect, checkOwnership(User), deleteUser);

module.exports = router