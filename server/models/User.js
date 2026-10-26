const mongoose = require('mongoose');

module.exports = mongoose.model('User', new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['faculty', 'student'], required: true }
}, { timestamps: true }));