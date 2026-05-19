const express = require("express");
const protect = require("../middleware/protect");
const authorize = require("../middleware/authorize")
const { getReports, getReportUsers, getAllUsersWithActivity, getUserDeals, getUserActivities, getUserLeads, getProspects } = require("../controllers/reportController");

const router = express.Router();

router.use(protect);

router.get("/", getReports);
router.get("/users" , authorize(['admin']), getReportUsers);
router.get("/all-users", authorize(['admin']), getAllUsersWithActivity);
router.get("/user-deals", getUserDeals);
router.get("/user-activities", getUserActivities);
router.get("/user-leads", getUserLeads);
router.get("/prospects", getProspects);

module.exports = router;