const mongoose = require('mongoose');

const userOpportunitySchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  opportunityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity', required: true },
  matchScore: { type: Number, default: 0 },
  whyRecommended: [{ type: String }],
  bookmarked: { type: Boolean, default: false },
  applied: { type: Boolean, default: false },
  dismissed: { type: Boolean, default: false },
  viewed: { type: Boolean, default: false },
  applicationProof: { type: String },
  appliedAt: { type: Date },
  bookmarkedAt: { type: Date },
  xpAwarded: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['recommended', 'viewed', 'saved', 'applied', 'dismissed', 'expired'],
    default: 'recommended'
  },

  // --- Registration & reminder tracking ---
  registered: { type: Boolean, default: false },
  registeredAt: { type: Date },
  remindersSent: {
    sevenDay: { type: Boolean, default: false },
    threeDay: { type: Boolean, default: false },
    oneDay: { type: Boolean, default: false },
    sameDay: { type: Boolean, default: false }
  },
  submissionStatus: {
    type: String,
    enum: ['not-started', 'in-progress', 'submitted', 'missed'],
    default: 'not-started'
  }
}, { timestamps: true });

userOpportunitySchema.index({ userId: 1, opportunityId: 1 }, { unique: true });

module.exports = mongoose.model('UserOpportunity', userOpportunitySchema);
