const mongoose = require('mongoose');

const careerPulseNewsSchema = new mongoose.Schema({
  headline: {
    type: String,
    required: true,
    unique: true
  },
  summary: {
    type: String,
    required: true
  },
  whyItMatters: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  source: {
    type: String,
    default: 'Official Source'
  },
  category: {
    type: String,
    required: true,
    enum: ['Big Tech', 'AI', 'Hiring', 'Startups', 'Skills', 'Students']
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('CareerPulseNews', careerPulseNewsSchema);
