const mongoose = require('mongoose');

const opportunitySchema = new mongoose.Schema({
  title: { type: String, required: true },
  organization: { type: String, required: true },
  type: {
    type: String,
    enum: ['internship', 'job', 'hackathon', 'scholarship', 'competition', 'open-source', 'hiring-drive', 'research'],
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
  applicationCount: { type: Number, default: 0 }
}, { timestamps: true });

// Add required indexes for query optimization
opportunitySchema.index({ deadline: 1 });
opportunitySchema.index({ type: 1 });
opportunitySchema.index({ organization: 1 });
opportunitySchema.index({ requiredSkills: 1 });
opportunitySchema.index({ opportunityStatus: 1 });
opportunitySchema.index({ title: 'text', organization: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Opportunity', opportunitySchema);
