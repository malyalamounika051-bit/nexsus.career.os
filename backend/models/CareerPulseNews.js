const mongoose = require('mongoose');

const careerPulseNewsSchema = new mongoose.Schema({
  headline: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String
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
    type: String
  },
  articleUrl: {
    type: String,
    required: true
  },
  source: {
    type: String,
    default: 'Official Source'
  },
  sourceLogo: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: ''
  },
  author: {
    type: String,
    default: 'Staff Editor'
  },
  readTime: {
    type: String,
    default: '3 min read'
  },
  category: {
    type: String,
    required: true,
    enum: ['Big Tech', 'AI', 'Hiring', 'Startups', 'Skills', 'Students']
  },
  publishedAt: {
    type: Date,
    default: Date.now
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Pre-save hook to ensure 'title' is always populated from 'headline'
careerPulseNewsSchema.pre('save', function(next) {
  if (this.headline && !this.title) {
    this.title = this.headline;
  }
  next();
});

module.exports = mongoose.model('CareerPulseNews', careerPulseNewsSchema);
