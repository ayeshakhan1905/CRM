const express = require('express');
const router = express.Router();
const protect = require('../middleware/protect');
const dashboardController = require('../controllers/dashboardController');

router.use(protect); // protect all dashboard routes

router.get('/counts', dashboardController.getCounts);
router.get('/deals-by-stage', dashboardController.getDealsByStage);
router.get('/conversion-rate', dashboardController.getConversionRate);
router.get('/conversion-rates', dashboardController.getConversionRates);
router.get('/recent-activity', dashboardController.getRecentActivity);
router.get('/revenue-by-stage', dashboardController.getRevenueByStage);

router.get("/deals-stats", async (req, res) => {
  try {
    const stats = await Deal.aggregate([
      { $group: { _id: "$stage", count: { $sum: 1 } } }
    ]);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: "Error fetching deals stats" });
  }
});

module.exports = router;
