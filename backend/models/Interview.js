const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  userId: {
    type: String,
    ref: 'User',
    required: true
  },
  jobRole: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Basic', 'Medium', 'Tough'],
    default: 'Medium'
  },
  questions: [{
    text: String,
    context: String
  }],
  transcript: [{
    question: String,
    userAnswer: String,
    aiFeedback: String,
    isFollowUp: Boolean,
    confidence: { type: Number, default: 0 },
    language: { type: String, default: 'en' },
    duration: { type: Number, default: 0 },
    analytics: {
      wordsSpoken: { type: Number, default: 0 },
      speakingSpeed: { type: Number, default: 0 },
      fillerWords: [String],
      fillerWordCount: { type: Number, default: 0 },
      pauseFrequency: { type: Number, default: 0 }
    }
  }],
  scores: {
    technical: { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
    confidence: { type: Number, default: 0 },
    overall: { type: Number, default: 0 }
  },
  feedback: {
    strengths: [String],
    weaknesses: [String],
    mistakes: [String],
    improvements: [String],
    learningRoadmap: [String],
    recommendedResources: [String]
  },
  status: {
    type: String,
    enum: ['in-progress', 'completed'],
    default: 'in-progress'
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('Interview', interviewSchema);
