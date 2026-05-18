const mongoose = require('mongoose');

const savedJobSchema = new mongoose.Schema({
  userUid: { 
    type: String, 
    required: true, 
    index: true 
  },
  jobId: { 
    type: String, 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  company: { 
    type: String, 
    required: true 
  },
  location: { 
    type: String 
  },
  salary: { 
    type: String 
  },
  type: { 
    type: String // Remote, On-site, Hybrid, Internship
  },
  platform: { 
    type: String // LinkedIn, Indeed, Glassdoor, etc.
  },
  url: { 
    type: String 
  },
  matchScore: { 
    type: Number 
  },
  reasonFit: {
    type: String
  },
  status: {
    type: String,
    enum: ['saved', 'applied', 'interviewing', 'rejected', 'offered'],
    default: 'saved'
  }
}, { timestamps: true });

// Ensure a user cannot save the same job twice
savedJobSchema.index({ userUid: 1, jobId: 1 }, { unique: true });

module.exports = mongoose.model('SavedJob', savedJobSchema);
