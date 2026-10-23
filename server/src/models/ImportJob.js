const mongoose = require('mongoose');

const importJobSchema = new mongoose.Schema({
  status: { 
    type: String, 
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'], 
    default: 'PENDING' 
  },
  totalRows: Number,
  importedCount: { type: Number, default: 0 },
  failedCount: { type: Number, default: 0 },
  errors: [{
    rowIndex: Number,
    error: String
  }],
  filePath: String,
  mapping: mongoose.Schema.Types.Mixed,
  categoryMethod: String,
  categoryRanges: mongoose.Schema.Types.Mixed,
  completedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('ImportJob', importJobSchema);
