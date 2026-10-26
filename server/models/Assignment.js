const mongoose = require('mongoose');

module.exports = mongoose.model('Assignment', new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  description: { type: String, default: '' },
  dueDate: { type: Date, required: true },
  maxMarks: { type: Number, required: true, min: 1 },
  allowResubmit: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true }));