const express = require("express");
const {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  deleteLead,
  convertLead, // ✅ new controller
} = require("../controllers/leadController.js");

const protect = require("../middleware/protect.js");
const checkOwnership = require("../middleware/checkOwnership.js");
const authorize = require("../middleware/authorize.js");
const logAction = require("../middleware/activityLog.js");
const Lead = require("../models/leadModel.js");

const router = express.Router();

router
  .route("/")
  .post(protect, logAction("Lead", "created"), createLead)
  .get(protect, getLeads);

router
  .route("/:id")
  .get(protect, getLeadById)
  .put(
    protect,
    checkOwnership(Lead),
    logAction("Lead", "updated"),
    updateLead
  )
  .delete(
    protect,
    checkOwnership(Lead),
    logAction("Lead", "deleted"),
    deleteLead
  );

// ✅ Convert Lead → Customer
router.post(
  "/:id/convert",
  protect,
  checkOwnership(Lead),
  logAction("Lead", "converted"),
  convertLead
);

module.exports = router;