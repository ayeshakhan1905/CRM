const Log = require('../models/logModel');

const logAction = (entityType, action) => {
  return async (req, res, next) => {
    res.on('finish', async () => {
      // Only log successful responses (status code < 400)
      if (res.statusCode < 400) {
        try {
          let log = await Log.create({
            createdBy: req.user._id,
            action,
            entityType,
            entityId: req.params.id || (res.locals.newEntityId || null),
            details: `${action} ${entityType}`,
            method: req.method,
            url: req.originalUrl,
            ip: req.ip
          });
          console.log(log);
        } catch (err) {
          console.error('Failed to log action:', err.message);
        }
      }
    });
    next();
  };
};

module.exports = logAction;