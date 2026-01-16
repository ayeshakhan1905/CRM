const { default: mongoose } = require('mongoose');
const Lead = require('../models/leadModel');
const Note = require('../models/noteModel');

const checkOwnership = (model) => async (req, res, next) => {
  try {
    console.log("hello");
    console.log(req.params.id);
    
     if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }
    const doc = await model.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Resource not found' });
    console.log(doc);
    
    if (doc.createdBy) {
      if (req.user.role !== 'admin' && !doc.createdBy.equals(req.user._id)) {
        return res.status(403).json({ message: 'Forbidden: Not allowed' });
      }
    } else {
      if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id.toString()) {
        return res.status(403).json({ message: 'Forbidden: You can only modify your own profile' });
      }
    }
    console.log("checked");
    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = checkOwnership;