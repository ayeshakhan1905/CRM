const express = require("express");
const protect = require("../middleware/protect");
const authorize = require("../middleware/authorize")
const { getReports, getReportUsers } = require("../controllers/reportController");

const router = express.Router();

router.use(protect);

router.get("/", getReports);
router.get("/users" , authorize(['admin']), getReportUsers);

module.exports = router;