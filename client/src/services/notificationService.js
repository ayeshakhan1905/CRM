import axios from "../api/axios";

// Notification service for creating notifications
export const notificationService = {
  // Create notification for task assignment
  async createTaskNotification(task, assignedUserId, action = 'assigned') {
    try {
      const message = action === 'assigned'
        ? `You have been assigned a new task: "${task.title}"`
        : `Task "${task.title}" has been updated`;

      await axios.post('/notifications', {
        userId: assignedUserId,
        title: action === 'assigned' ? 'New Task Assigned' : 'Task Updated',
        message,
        type: 'task',
        relatedModel: 'Task',
        relatedId: task._id,
        actionUrl: `/dashboard/tasks`
      });
    } catch (error) {
      console.error('Failed to create task notification:', error);
    }
  },

  // Create notification for deal updates
  async createDealNotification(deal, userId, action = 'updated') {
    try {
      const actions = {
        created: `New deal "${deal.title}" has been created`,
        updated: `Deal "${deal.title}" has been updated`,
        won: `Deal "${deal.title}" has been won!`,
        lost: `Deal "${deal.title}" has been lost`
      };

      await axios.post('/notifications', {
        userId,
        title: 'Deal Update',
        message: actions[action] || `Deal "${deal.title}" has been ${action}`,
        type: action === 'won' ? 'success' : action === 'lost' ? 'error' : 'deal',
        relatedModel: 'Deal',
        relatedId: deal._id,
        actionUrl: `/dashboard/deals`
      });
    } catch (error) {
      console.error('Failed to create deal notification:', error);
    }
  },

  // Create notification for lead updates
  async createLeadNotification(lead, userId, action = 'updated') {
    try {
      const actions = {
        created: `New lead "${lead.name}" has been added`,
        updated: `Lead "${lead.name}" has been updated`,
        converted: `Lead "${lead.name}" has been converted to a customer!`
      };

      await axios.post('/notifications', {
        userId,
        title: 'Lead Update',
        message: actions[action] || `Lead "${lead.name}" has been ${action}`,
        type: action === 'converted' ? 'success' : 'lead',
        relatedModel: 'Lead',
        relatedId: lead._id,
        actionUrl: `/dashboard/leads`
      });
    } catch (error) {
      console.error('Failed to create lead notification:', error);
    }
  },

  // Create notification for customer updates
  async createCustomerNotification(customer, userId, action = 'updated') {
    try {
      const actions = {
        created: `New customer "${customer.name}" has been added`,
        updated: `Customer "${customer.name}" has been updated`
      };

      await axios.post('/notifications', {
        userId,
        title: 'Customer Update',
        message: actions[action] || `Customer "${customer.name}" has been ${action}`,
        type: 'customer',
        relatedModel: 'Customer',
        relatedId: customer._id,
        actionUrl: `/dashboard/customers`
      });
    } catch (error) {
      console.error('Failed to create customer notification:', error);
    }
  },

  // Create general notification
  async createGeneralNotification(userId, title, message, type = 'info') {
    try {
      await axios.post('/notifications', {
        userId,
        title,
        message,
        type
      });
    } catch (error) {
      console.error('Failed to create general notification:', error);
    }
  },

  // Create notification for upcoming due dates
  async createDueDateNotification(task, userId) {
    try {
      const dueDate = new Date(task.dueDate);
      const today = new Date();
      const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

      let message, type;
      if (daysUntilDue === 0) {
        message = `Task "${task.title}" is due today!`;
        type = 'error';
      } else if (daysUntilDue === 1) {
        message = `Task "${task.title}" is due tomorrow`;
        type = 'warning';
      } else if (daysUntilDue <= 3) {
        message = `Task "${task.title}" is due in ${daysUntilDue} days`;
        type = 'warning';
      } else {
        return; // Don't create notification for tasks due far in the future
      }

      await axios.post('/notifications', {
        userId,
        title: 'Task Due Soon',
        message,
        type,
        relatedModel: 'Task',
        relatedId: task._id,
        actionUrl: `/dashboard/tasks`
      });
    } catch (error) {
      console.error('Failed to create due date notification:', error);
    }
  },

  // Create notification for stage updates
  async createStageNotification(stage, userId, action = 'updated') {
    try {
      const actions = {
        created: `New stage "${stage.name}" has been added to the pipeline`,
        updated: `Stage "${stage.name}" has been updated`,
        deleted: `Stage "${stage.name}" has been removed from the pipeline`
      };

      await axios.post('/notifications', {
        userId,
        title: action === 'deleted' ? 'Stage Removed' : action === 'created' ? 'New Stage Added' : 'Pipeline Update',
        message: actions[action] || `Stage "${stage.name}" has been ${action}`,
        type: 'stage',
        relatedModel: 'Stage',
        relatedId: stage._id,
        actionUrl: `/dashboard/stages`
      });
    } catch (error) {
      console.error('Failed to create stage notification:', error);
    }
  }
};