const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: String,
    phone: String,

    status: {
      type: String,
      enum: ["hot", "warm", "cold"],
      default: "warm",
    },

    // Relationships
    customer: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Customer" // Filled after conversion
    },
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
    }],

    // Ownership
    assignedTo: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Lead", leadSchema);