const mongoose = require('mongoose');

const conversationMemorySchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  
  // Rolling summary of older conversations (for long-term memory)
  conversationSummary: { type: String, default: '' },
  
  // User profile & preferences learned over time
  userPreferences: {
    interests: [{ type: String }],
    careerStage: { type: String, default: '' },
    communicationStyle: { type: String, default: '' },
    strengths: [{ type: String }],
  },
  
  // Topics discussed for context continuity
  topicsDiscussed: [{
    topic: { type: String },
    timestamp: { type: Date, default: Date.now },
  }],
  
  // Last discussed topic with options (for reference resolution)
  lastDiscussedTopic: {
    type: {
      label: { type: String, default: '' },
      options: [{ type: String }],
    },
    default: { label: '', options: [] },
  },
  
  recommendedCareers: [{ type: String }],
  roadmap: { type: String, default: '' },
  careerDNA: { type: String, default: '' },
  goals: [{ type: String }],
  interviewScores: [{
    topic: { type: String },
    score: { type: Number },
    date: { type: Date },
  }],
  
  // Total message count for tracking
  totalMessageCount: { type: Number, default: 0 },
  
}, { timestamps: true });

module.exports = mongoose.model('ConversationMemory', conversationMemorySchema);
