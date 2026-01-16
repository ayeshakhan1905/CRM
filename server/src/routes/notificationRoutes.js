const express = require('express');
const router = express.Router();
const {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount
} = require('../controllers/notificationController');
const protect = require('../middleware/protect');

router.route('/')
  .get(protect, getNotifications)
  .post(protect, createNotification);

router.route('/unread-count')
  .get(protect, getUnreadCount);

router.route('/mark-all-read')
  .put(protect, markAllAsRead);

router.route('/:id/read')
  .put(protect, markAsRead);

router.route('/:id')
  .delete(protect, deleteNotification);

module.exports = router;