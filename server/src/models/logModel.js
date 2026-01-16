const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },        // created, updated, deleted
  entityType: { type: String, required: true },   // Lead, Deal, Task, Note, Customer
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  details: { type: String },                      // optional description
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Log', logSchema);