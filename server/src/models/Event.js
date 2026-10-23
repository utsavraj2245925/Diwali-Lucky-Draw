const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['DRAFT', 'READY', 'LIVE', 'COMPLETED'], 
    default: 'DRAFT' 
  },
  config: {
    noRepeatWinners: { type: Boolean, default: true },
    locked: { type: Boolean, default: false }
  },
  startedAt: Date,
  completedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
