const mongoose = require('mongoose');

const roundSchema = new mongoose.Schema({
  category: { 
    type: String, 
    required: true, 
    enum: ['Manager', 'Company Staff', 'Company Worker'] 
  },
  roundNumber: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 3 
  },
  prize: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Prize', 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['PENDING', 'DRAWING', 'COMPLETED'], 
    default: 'PENDING' 
  },
  winner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Employee', 
    sparse: true 
  },
  drawnAt: Date,
  order: { type: Number, required: true }
}, { timestamps: true });

roundSchema.index({ category: 1, roundNumber: 1 }, { unique: true });

module.exports = mongoose.model('Round', roundSchema);
