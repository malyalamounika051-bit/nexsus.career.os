const mongoose = require('mongoose');

const opportunitySchema = new mongoose.Schema({
  title: { type: String, required: true },
  organization: { type: String, required: true },
  type: {
    type: String,
    enum: ['hackathon', 'scholarship', 'competition', 'open-source', 'research', 'course', 'certification', 'quiz', 'fellowship', 'innovation', 'coding-challenge', 'startup-challenge'],
    required: true
  },
  description: { type: String },
  deadline: { type: Date },
  applicationUrl: { type: String, required: true },
  eligibility: { type: String },
  requiredSkills: [{ type: String }],
  preferredSkills: [{ type: String }],
  location: { type: String, default: 'Remote' },
  remote: { type: Boolean, default: true },
  tags: [{ type: String }],
  source: { type: String },
  sourceType: { type: String },
  sourceScore: { type: Number, default: 70 },
  verificationStatus: {
    type: String,
    enum: ['verified', 'pending', 'expired', 'broken'],
    default: 'pending'
  },
  isVerified: { type: Boolean, default: false },
  lastVerified: { type: Date, default: Date.now },
  opportunityStatus: {
    type: String,
    enum: ['active', 'expired', 'archived'],
    default: 'active'
  },
  applicationCount: { type: Number, default: 0 },
  submissionDeadline: { type: Date },
  resultDate: { type: Date },
  benefits: [{ type: String }],
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  estimatedCommitment: { type: String },
  isFeatured: { type: Boolean, default: false },
  category: { type: String },
  prizePool: { type: String },
  participantCount: { type: Number, default: 0 }
}, { timestamps: true });

// Add required indexes for query optimization
opportunitySchema.index({ deadline: 1 });
opportunitySchema.index({ type: 1 });
opportunitySchema.index({ organization: 1 });
opportunitySchema.index({ requiredSkills: 1 });
opportunitySchema.index({ opportunityStatus: 1 });
opportunitySchema.index({ title: 'text', organization: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Opportunity', opportunitySchema);
