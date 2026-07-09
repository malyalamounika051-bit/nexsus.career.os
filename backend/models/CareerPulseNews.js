const mongoose = require('mongoose');

const careerPulseNewsSchema = new mongoose.Schema({
  headline: {
    type: String,
    required: true
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
    default: ''
  },
  articleUrl: {
    type: String,
    required: true,
    unique: true
  },
  url: {
    type: String
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
    enum: ['AI', 'Big Tech', 'Hiring', 'Startups', 'Skills', 'Students', 'Open Source', 'Cloud', 'Cybersecurity', 'Data Science', 'Internships', 'Scholarships', 'Career Tips', 'Remote Jobs']
  },
  tags: {
    type: [String],
    default: []
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

// Index for fast category + date queries
careerPulseNewsSchema.index({ category: 1, publishedAt: -1 });
careerPulseNewsSchema.index({ timestamp: 1 }, { expireAfterSeconds: 172800 }); // Auto-delete after 48 hours

// Pre-save: sync title from headline
careerPulseNewsSchema.pre('save', function(next) {
  if (this.headline && !this.title) {
    this.title = this.headline;
  }
  if (!this.url && this.articleUrl) {
    this.url = this.articleUrl;
  }
  next();
});

module.exports = mongoose.model('CareerPulseNews', careerPulseNewsSchema);
