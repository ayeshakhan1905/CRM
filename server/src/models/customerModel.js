const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: String,
  phone: String,
  company: String,
  location: String,
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },

  // Relationships
  deals: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Deal" 
  }],
  notes: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Note" 
  }],
  tasks: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Task" 
  }]
}, { timestamps: true });

module.exports = mongoose.model("Customer", customerSchema);
