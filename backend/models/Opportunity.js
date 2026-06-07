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
  deadline: { type: Date, required: true },
  applicationUrl: { type: String, required: true },
  eligibility: { type: String },
  requiredSkills: [{ type: String }],
  location: { type: String, default: 'Remote' },
  source: { type: String },
  sourceScore: { type: Number, default: 70 },
  tags: [{ type: String }],
  status: { type: String, enum: ['active', 'expired'], default: 'active' },
  lastVerified: { type: Date, default: Date.now }
}, { timestamps: true });

opportunitySchema.index({ title: 'text', organization: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Opportunity', opportunitySchema);
