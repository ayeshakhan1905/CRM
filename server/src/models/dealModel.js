var mongoose = require('mongoose');

var dealSchema = new mongoose.Schema({
    title: { type: String, required: true },

    // Relationships
    customer: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Customer', 
        required: true 
    },
    lead: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Lead' // Optional: for deals created from leads
    },
    stage: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Stage', 
        required: true 
    },

    // Deal details
    value: { type: Number, required: true },
    closeDate: { type: Date },
    status: { 
        type: String, 
        enum: ['In Progress', 'Won', 'Lost'], 
        default: 'In Progress' 
    },

    // Related data
    notes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Note' }],
    tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Deal', dealSchema);
