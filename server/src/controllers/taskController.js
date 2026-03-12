const Task = require("../models/taskModel");
const Lead = require("../models/leadModel");
const Customer = require("../models/customerModel");
const Deal = require("../models/dealModel");
const { buildSearchQuery } = require("../utils/buildSearchQueries");

// Helper: map lowercase type to proper model string
const mapTypeToModel = (type) => {
  if (!type) return null;
  const normalized = type.toString().toLowerCase();

  switch (normalized) {
    case "lead":
      return "Lead";
    case "customer":
      return "Customer";
    case "deal":
      return "Deal";
    default:
      return null;
  }
}

exports.createTask = async (req, res) => {
  try {
    const { title, description, dueDate, status, priority, type, refId, assignedTo } = req.body;
    const relatedModel = mapTypeToModel(type);
    if (!relatedModel) return res.status(400).json({ message: "Invalid type" });

    // Validate refId
    if (!refId || typeof refId !== "string" || !refId.match(/^[a-fA-F0-9]{24}$/)) {
      return res.status(400).json({ message: "A valid related ID is required." });
    }

    let refDoc;
    if (relatedModel === "Lead") refDoc = await Lead.findById(refId);
    if (relatedModel === "Customer") refDoc = await Customer.findById(refId);
    if (relatedModel === "Deal") refDoc = await Deal.findById(refId);

    if (!refDoc) return res.status(404).json({ message: `${relatedModel} not found` });

    // build create object, filtering out empty optional values
    const taskData = {
      title,
      description,
      status: status || "pending",
      priority: priority || "medium",
      relatedModel,
      relatedTo: refId,
      createdBy: req.user._id
    };
    if (dueDate) taskData.dueDate = dueDate;
    if (assignedTo) taskData.assignedTo = assignedTo;

    const task = await Task.create(taskData);

    refDoc.tasks.push(task._id);
    await refDoc.save();

    // Create notification for assigned user
    if (assignedTo) {
      const Notification = require('../models/notificationModel');
      const notification = await Notification.create({
        user: assignedTo,
        title: 'New Task Assigned',
        message: `You have been assigned a new task: "${task.title}"`,
        type: 'task',
        relatedModel: 'Task',
        relatedId: task._id,
        actionUrl: `/dashboard/tasks`
      });

      // Emit real-time notification
      const io = req.app.get('io');
      if (io) {
        io.to(assignedTo).emit('notification-created', {
          _id: notification._id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          user: notification.user,
          isRead: notification.isRead,
          createdAt: notification.createdAt
        });
      }
    }

    res.locals.newEntityId = task._id;
    res.status(201).json(await task.populate("assignedTo createdBy"));
  } catch (error) {
    console.error("Error in createTask:", error);
    let message = error.message;
    if (error.name === 'ValidationError' && error.errors) {
      // concatenate all validation error messages
      message = Object.values(error.errors)
        .map((e) => e.message)
        .join('; ');
    }
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message });
  }
};

exports.getTasks = async (req, res) => {
  try {
    let query = buildSearchQuery(req.query);

    if (req.user.role !== "admin") {
      // if client is filtering by a specific relatedModel/relatedTo (e.g. a deal page)
      // allow all matching tasks regardless of who created/was assigned. Otherwise, restrict
      // to tasks the user owns or is assigned to.
      if (!(req.query.relatedModel && req.query.relatedTo)) {
        query.$or = [
          { createdBy: req.user._id },
          { assignedTo: req.user._id }
        ];
      }
    }

    const tasks = await Task.find(query)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .populate("relatedTo");

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .populate("relatedTo");

    if (!task) return res.status(404).json({ message: "Task not found" });

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { type, refId } = req.body;
    let updateData = { ...req.body };

    // map type/refId -> relatedModel/relatedTo if passed
    if (type) {
      updateData.relatedModel = mapTypeToModel(type);
      delete updateData.type;
    }
    if (refId) {
      updateData.relatedTo = refId;
      delete updateData.refId;
    }

    // Get the current task before updating
    const currentTask = await Task.findById(req.params.id);
    if (!currentTask) return res.status(404).json({ message: "Task not found" });

    const task = await Task.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .populate("relatedTo");

    if (!task) return res.status(404).json({ message: "Task not found" });

    // Check if assignedTo changed and create notification
    if (updateData.assignedTo && updateData.assignedTo !== currentTask.assignedTo?.toString()) {
      // Create database notification
      const Notification = require('../models/notificationModel');
      const notification = await Notification.create({
        user: updateData.assignedTo,
        title: 'Task Assigned',
        message: `You have been assigned the task: "${task.title}"`,
        type: 'task',
        relatedModel: 'Task',
        relatedId: task._id,
        actionUrl: `/dashboard/tasks`
      });

      // Emit real-time notification
      const io = req.app.get('io');
      if (io) {
        io.to(updateData.assignedTo).emit('notification-created', {
          _id: notification._id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          user: notification.user,
          isRead: notification.isRead,
          createdAt: notification.createdAt
        });
      }
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Remove from related model
    if (task.relatedModel === "Lead") {
      await Lead.findByIdAndUpdate(task.relatedTo, { $pull: { tasks: task._id } });
    }
    if (task.relatedModel === "Customer") {
      await Customer.findByIdAndUpdate(task.relatedTo, { $pull: { tasks: task._id } });
    }
    if (task.relatedModel === "Deal") {
      await Deal.findByIdAndUpdate(task.relatedTo, { $pull: { tasks: task._id } });
    }

    await task.deleteOne();
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};