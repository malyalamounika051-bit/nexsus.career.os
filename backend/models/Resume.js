const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  user: {
    type: String, // Changed from ObjectId to String to support Firebase UIDs
    required: true
  },
  resumeTitle: {
    type: String,
    required: true,
    default: 'My Resume'
  },
  templateId: {
    type: String,
    required: true,
    default: 'modern'
  },
  personalInfo: {
    name: String,
    title: String,
    email: String,
    phone: String,
    location: String,
    linkedin: String,
    website: String,
    summary: String,
    avatar: String
  },
  skills: [String],
  experiences: [{
    title: String,
    company: String,
    location: String,
    period: String,
    current: { type: Boolean, default: false },
    desc: String
  }],
  internships: [{
    title: String,
    company: String,
    location: String,
    period: String,
    desc: String
  }],
  education: [{
    degree: String,
    institution: String,
    location: String,
    year: String,
    period: String,
    desc: String
  }],
  projects: [{
    name: String,
    tech: String,
    link: String,
    desc: String
  }],
  achievements: [String],
  languages: [String],
  certifications: [String],
  socialLinks: [{
    platform: String,
    url: String
  }],
  customSections: [{
    title: String,
    content: String
  }],
  sectionOrder: {
    type: [String],
    default: ['personalInfo', 'summary', 'experience', 'education', 'skills', 'projects', 'achievements']
  },
  analysis: {
    score: { type: Number, default: 0 },
    atsScore: { type: Number, default: 0 },
    tips: [String],
    keywords: [String]
  },
  shareableToken: {
    type: String,
    unique: true,
    sparse: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  customStyles: {
    primaryColor: String,
    fontFamily: String,
    fontSize: String
  }
}, { timestamps: true });

resumeSchema.pre('save', function(next) {
  if (!this.shareableToken) {
    this.shareableToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
  next();
});

module.exports = mongoose.model('Resume', resumeSchema);
