const mongoose = require('mongoose');

const drawOperationSchema = new mongoose.Schema({
  round: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Round',
    required: true,
    unique: true
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  initiatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  status: {
    type: String,
    enum: ['PROCESSING', 'COMPLETED', 'FAILED'],
    default: 'PROCESSING'
  },
  idempotencyKey: {
    type: String,
    sparse: true
  },
  selectionMethod: { type: String, default: 'crypto.randomInt' },
  eligiblePoolSize: Number,
  error: String
}, { timestamps: true });

drawOperationSchema.index({ round: 1 });

module.exports = mongoose.model('DrawOperation', drawOperationSchema);
