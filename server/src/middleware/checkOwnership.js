const { default: mongoose } = require('mongoose');

// reusable ownership-check middleware
const checkOwnership = (model) => async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const err = new Error('Invalid ID');
      err.statusCode = 400;
      return next(err);
    }

    const doc = await model.findById(id);
    if (!doc) {
      const err = new Error('Resource not found');
      err.statusCode = 404;
      return next(err);
    }

    // if document has createdBy field, enforce ownership/admin
    if (doc.createdBy) {
      if (req.user.role !== 'admin' && !doc.createdBy.equals(req.user._id)) {
        const err = new Error('Forbidden: Not allowed');
        err.statusCode = 403;
        return next(err);
      }
    } else {
      // for user objects, compare id to current user
      if (req.user.role !== 'admin' && req.user._id.toString() !== id.toString()) {
        const err = new Error('Forbidden: You can only modify your own profile');
        err.statusCode = 403;
        return next(err);
      }
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = checkOwnership;