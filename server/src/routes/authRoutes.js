const router = require("express").Router()
const { registerUser, loginUser, logoutUser, getMe } = require("../controllers/authController")
const protect = require("../middleware/protect")


router.post('/register' , registerUser)
router.post('/login', loginUser)
router.get('/logout' , protect ,logoutUser)
router.get("/me", protect, getMe);

module.exports = router