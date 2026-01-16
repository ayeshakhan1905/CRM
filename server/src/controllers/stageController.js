const Stage = require('../models/stageModel');
const { buildSearchQuery } = require('../utils/buildSearchQueries');

// @desc Create a stage
exports.createStage = async (req, res) => {
  try {
    // Check if stage with same name already exists
    const existingStage = await Stage.findOne({ name: req.body.name });
    if (existingStage) {
      return res.status(409).json({ 
        error: 'Stage already exists',
        message: `A stage with the name "${req.body.name}" already exists. Please choose a different name.`
      });
    }

    const stage = await Stage.create({
  ...req.body,
  order: Number(req.body.order)
});
    console.log(stage);

    // Create notifications for all users about stage creation (don't fail if this fails)
    try {
      const User = require('../models/userModel');
      const Notification = require('../models/notificationModel');

      const users = await User.find({ active: true, _id: { $ne: req.user._id } });
      const notifications = users.map(user => ({
        user: user._id,
        title: 'New Stage Added',
        message: `New stage "${stage.name}" has been added to the pipeline`,
        type: 'stage',
        relatedModel: 'Stage',
        relatedId: stage._id,
        actionUrl: '/dashboard/stages'
      }));

      await Notification.insertMany(notifications);

      // Emit notification events for each user
      const io = req.app.get('io');
      if (io) {
        notifications.forEach(notification => {
          console.log(`Emitting stage creation notification to user ${notification.user}:`, notification.title);
          io.to(notification.user.toString()).emit('notification-created', {
            _id: notification._id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            user: notification.user,
            isRead: notification.isRead,
            createdAt: notification.createdAt
          });
        });
      }
    } catch (notificationError) {
      console.error('Failed to create notifications for stage creation:', notificationError.message);
      // Don't fail the operation if notifications fail
    }

    res.locals.newEntityId = stage._id
    res.status(201).json(stage);

    // Emit real-time stage creation notification AFTER successful response
    const io = req.app.get('io');
    if (io) {
      io.emit('stage-created', {
        id: stage._id,
        name: stage.name,
        description: stage.description,
        order: stage.order,
        createdBy: req.user.name
      });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// @desc Get all stages (sorted by order)
exports.getStages = async (req, res) => {
  try {
    let query = buildSearchQuery(req.query);

    const stages = await Stage.find(query).sort("order");
    res.json(stages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// @desc Get single stage by ID
exports.getStageById = async (req, res) => {
  try {
    const stage = await Stage.findById(req.params.id);
    if (!stage) return res.status(404).json({ error: 'Stage not found' });
    res.json(stage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// @desc Update stage
exports.updateStage = async (req, res) => {
  try {
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'No data provided for update' });
    }

    // Check if another stage with the same name already exists
    if (req.body.name) {
      const existingStage = await Stage.findOne({ 
        name: req.body.name, 
        _id: { $ne: req.params.id } 
      });
      if (existingStage) {
        return res.status(409).json({ 
          error: 'Stage name already exists',
          message: `A stage with the name "${req.body.name}" already exists. Please choose a different name.`
        });
      }
    }

    const stage = await Stage.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!stage) return res.status(404).json({ error: 'Stage not found' });

    // Create notifications for all users about stage update (don't fail if this fails)
    try {
      const User = require('../models/userModel');
      const Notification = require('../models/notificationModel');

      const users = await User.find({ active: true, _id: { $ne: req.user._id } });
      const notifications = users.map(user => ({
        user: user._id,
        title: 'Stage Updated',
        message: `Stage "${stage.name}" has been updated`,
        type: 'stage',
        relatedModel: 'Stage',
        relatedId: stage._id,
        actionUrl: '/dashboard/stages'
      }));

      await Notification.insertMany(notifications);

      // Emit notification events for each user
      const io = req.app.get('io');
      if (io) {
        notifications.forEach(notification => {
          io.to(notification.user.toString()).emit('notification-created', {
            _id: notification._id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            user: notification.user,
            isRead: notification.isRead,
            createdAt: notification.createdAt
          });
        });
      }
    } catch (notificationError) {
      console.error('Failed to create notifications for stage update:', notificationError.message);
      // Don't fail the operation if notifications fail
    }

    res.json(stage);

    // Emit real-time stage update notification AFTER successful response
    const io = req.app.get('io');
    if (io) {
      io.emit('stage-updated', {
        id: stage._id,
        name: stage.name,
        description: stage.description,
        order: stage.order,
        updatedBy: req.user.name
      });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// @desc Delete stage
exports.deleteStage = async (req, res) => {
  try {
    const stage = await Stage.findByIdAndDelete(req.params.id);
    if (!stage) return res.status(404).json({ error: 'Stage not found' });

    // Create notifications for all users about stage deletion (don't fail if this fails)
    try {
      const User = require('../models/userModel');
      const Notification = require('../models/notificationModel');

      const users = await User.find({ active: true, _id: { $ne: req.user._id } });
      const notifications = users.map(user => ({
        user: user._id,
        title: 'Stage Deleted',
        message: `Stage "${stage.name}" has been removed from the pipeline`,
        type: 'stage',
        relatedModel: 'Stage',
        relatedId: stage._id,
        actionUrl: '/dashboard/stages'
      }));

      await Notification.insertMany(notifications);

      // Emit notification events for each user
      const io = req.app.get('io');
      if (io) {
        notifications.forEach(notification => {
          io.to(notification.user.toString()).emit('notification-created', {
            _id: notification._id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            user: notification.user,
            isRead: notification.isRead,
            createdAt: notification.createdAt
          });
        });
      }
    } catch (notificationError) {
      console.error('Failed to create notifications for stage deletion:', notificationError.message);
      // Don't fail the operation if notifications fail
    }

    res.json({ message: 'Stage deleted successfully' });

    // Emit real-time stage deletion notification AFTER successful response
    const io = req.app.get('io');
    if (io) {
      io.emit('stage-deleted', {
        id: stage._id,
        name: stage.name,
        deletedBy: req.user.name
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};