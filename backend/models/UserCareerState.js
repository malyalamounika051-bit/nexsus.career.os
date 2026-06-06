const mongoose = require('mongoose');

const UserCareerStateSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },

  // Career DNA
  careerDNA: {
    archetype: String,
    traitScores: {
      technical: { type: Number, default: 0 },
      creative: { type: Number, default: 0 },
      analytical: { type: Number, default: 0 },
      leadership: { type: Number, default: 0 },
      communication: { type: Number, default: 0 }
    },
    topMatches: [{
      career: String,
      matchPercent: Number
    }],
    assessmentCount: { type: Number, default: 0 },
    lastAssessedAt: Date
  },

  // Roadmap Progress
  activeRoadmaps: [{
    roadmapId: { type: mongoose.Schema.Types.ObjectId, ref: 'Career' },
    domain: String,
    completedPhases: { type: Number, default: 0 },
    totalPhases: { type: Number, default: 7 },
    lastUpdatedAt: Date
  }],

  // Resume State
  resumeState: {
    hasResume: { type: Boolean, default: false },
    resumeScore: { type: Number, default: 0 },
    atsScore: { type: Number, default: 0 },
    lastUpdatedAt: Date
  },

  // Interview State
  interviewState: {
    totalInterviews: { type: Number, default: 0 },
    avgScore: { type: Number, default: 0 },
    bestRole: String,
    readinessLevel: {
      type: String,
      enum: ['not-started', 'beginner', 'ready', 'confident'],
      default: 'not-started'
    },
    lastInterviewAt: Date
  },

  // Job Search State
  jobState: {
    savedJobsCount: { type: Number, default: 0 },
    topMatchScore: { type: Number, default: 0 },
    preferredRoles: [String],
    preferredLocations: [String]
  },

  // Journey Stage
  currentStage: {
    type: String,
    enum: ['new', 'dna-complete', 'roadmap-active', 'resume-building', 'interview-prep', 'job-hunting', 'employed'],
    default: 'new'
  },

  // Sara Memory
  saraMemory: {
    conversationSummary: String,
    recommendedCareers: [String],
    goals: [String],
    topicsDiscussed: [{ topic: String, timestamp: Date }],
    totalMessageCount: { type: Number, default: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model('UserCareerState', UserCareerStateSchema);
