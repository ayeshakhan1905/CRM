var mongoose = require('mongoose');

var stageSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    order: { 
        type: Number, 
        required: true, 
        unique: true, 
        default: 0 
    },
    // Optional: for future multiple pipelines
    pipelineType: { 
        type: String, 
        default: "default" 
    }
}, { timestamps: true });

module.exports = mongoose.model('Stage', stageSchema);