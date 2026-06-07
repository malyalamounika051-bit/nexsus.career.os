const mongoose = require('mongoose');

const opportunityMasterSchema = new mongoose.Schema({
  title: { type: String, required: true },
  organization: { type: String, required: true },
  type: {
    type: String,
    enum: ['internship', 'job', 'hackathon', 'scholarship', 'competition', 'open-source', 'hiring-drive', 'research'],
    required: true
  },
  description: { type: String },
  applicationUrl: { type: String, required: true },
  eligibility: { type: String },
  requiredSkills: [{ type: String }],
  location: { type: String, default: 'Remote' },
  source: { type: String },
  sourceScore: { type: Number, default: 70 },
  tags: [{ type: String }],
  registrationDeadline: { type: Date },
  submissionDeadline: { type: Date },
  eventStartDate: { type: Date },
  eventEndDate: { type: Date },
  isVerified: { type: Boolean, default: false },
  verificationStatus: {
    type: String,
    enum: ['verified', 'pending', 'expired', 'broken'],
    default: 'pending'
  },
  freshnessScore: { type: Number, default: 100 },
  popularityScore: { type: Number, default: 0 },
  opportunityScore: { type: Number, default: 0 },
  difficultyLevel: { type: String },
  estimatedCommitment: { type: String },
  benefits: [{ type: String }],
  lastVerified: { type: Date, default: Date.now }
}, { timestamps: true });

// Add compound indexes for search & sorting performance
opportunityMasterSchema.index({ title: 'text', organization: 'text', description: 'text', tags: 'text' });
opportunityMasterSchema.index({ type: 1, isVerified: 1, status: 1 });
opportunityMasterSchema.index({ requiredSkills: 1 });

module.exports = mongoose.model('OpportunityMaster', opportunityMasterSchema);
