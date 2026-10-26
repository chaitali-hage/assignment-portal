const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  notes: { type: String, default: '' },
  projectLink: { type: String, required: true },
  marks: { type: Number, default: null },
  remarks: { type: String, default: '' },
  gradedAt: { type: Date, default: null }
}, { timestamps: true });

// one submission per student per assignment
schema.index({ assignment: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Submission', schema);