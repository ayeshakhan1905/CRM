const Notification = require('../models/notificationModel');
const asyncHandler = require('express-async-handler');

// @desc    Get all notifications for user
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const notifications = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'name');

  const total = await Notification.countDocuments({ user: req.user._id });
  const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });

  res.json({
    notifications,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    unreadCount
  });
});

// @desc    Create new notification
// @route   POST /api/notifications
// @access  Private (usually called internally)
const createNotification = asyncHandler(async (req, res) => {
  const { title, message, type, relatedModel, relatedId, actionUrl, userId } = req.body;

  const notification = await Notification.create({
    user: userId || req.user._id,
    title,
    message,
    type: type || 'info',
    relatedModel,
    relatedId,
    actionUrl
  });

  // Emit real-time notification
  const io = req.app.get('io');
  if (io) {
    io.to(notification.user.toString()).emit('notification-created', {
      _id: notification._id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      user: notification.user,
      isRead: notification.isRead,
      createdAt: notification.createdAt
    });
  }

  res.status(201).json(notification);
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  if (notification.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized');
  }

  notification.isRead = true;
  await notification.save();

  res.json(notification);
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/mark-all-read
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, isRead: false },
    { isRead: true }
  );

  res.json({ message: 'All notifications marked as read' });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  if (notification.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized');
  }

  await Notification.findByIdAndDelete(req.params.id);

  res.json({ message: 'Notification deleted' });
});

// @desc    Get unread count
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadCount = asyncHandler(async (req, res) => {
  const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });

  res.json({ unreadCount });
});

module.exports = {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount
};