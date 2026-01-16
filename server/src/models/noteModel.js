const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },

  // Polymorphic relationship
  relatedModel: { 
    type: String, 
    enum: ["Lead", "Customer", "Deal"], 
    required: true 
  },
  relatedTo: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    refPath: "relatedModel" 
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, { timestamps: true });


// Optional: Indexes for faster lookups
noteSchema.index({ relatedModel: 1, relatedTo: 1 });
noteSchema.index({ createdBy: 1 });

module.exports = mongoose.model("Note", noteSchema);