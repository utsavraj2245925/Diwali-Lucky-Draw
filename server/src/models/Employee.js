const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  designation: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Manager', 'Company Staff', 'Company Worker'],
    trim: true
  },
  isWinner: {
    type: Boolean,
    default: false
  },
  winnerRound: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Round'
  },
  reservationOpId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DrawOperation',
    default: null
  }
}, { timestamps: true });

employeeSchema.index({ employeeId: 1 });
employeeSchema.index({ category: 1 });

module.exports = mongoose.model('Employee', employeeSchema);
