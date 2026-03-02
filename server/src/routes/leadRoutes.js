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
const { validateCreateLead, validateUpdateLead, validateId } = require("../middleware/validation");

const router = express.Router();

router
  .route("/")
  .post(protect, validateCreateLead, logAction("Lead", "created"), createLead)
  .get(protect, getLeads);

router
  .route("/:id")
  .get(protect, validateId, getLeadById)
  .put(
    protect,
    validateUpdateLead,
    checkOwnership(Lead),
    logAction("Lead", "updated"),
    updateLead
  )
  .delete(
    protect,
    validateId,
    checkOwnership(Lead),
    logAction("Lead", "deleted"),
    deleteLead
  );

// ✅ Convert Lead → Customer
router.post(
  "/:id/convert",
  protect,
  validateId,
  checkOwnership(Lead),
  logAction("Lead", "converted"),
  convertLead
);

module.exports = router;