const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  cardNumber: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true 
  },
  employee: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Employee', 
    unique: true,
    sparse: true 
  },
  qrToken: { 
    type: String, 
    unique: true, 
    sparse: true 
  },
  status: { 
    type: String, 
    enum: ['unused', 'assigned', 'blocked'], 
    default: 'unused' 
  },
  assignedAt: Date
}, { timestamps: true });

cardSchema.index({ cardNumber: 1 });
cardSchema.index({ qrToken: 1 });

module.exports = mongoose.model('Card', cardSchema);
