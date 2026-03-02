const router = require("express").Router()
const { registerUser, loginUser, logoutUser, getMe } = require("../controllers/authController")
const protect = require("../middleware/protect")
const { validateRegister, validateLogin } = require("../middleware/validation")


router.post('/register', validateRegister, registerUser)
router.post('/login', validateLogin, loginUser)
router.get('/logout' , protect ,logoutUser)
router.get("/me", protect, getMe);

module.exports = router