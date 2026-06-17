const mongoose = require('mongoose');

/* ── Resource sub-schema ───────────────────────────────── */
const resourceSchema = new mongoose.Schema({
  title: String,
  url: String,
  type: {
    type: String,
    enum: ['video', 'article', 'course', 'book', 'certification', 'platform', 'tool', 'tutorial', 'documentation'],
    default: 'article',
  },
  category: {
    type: String,
    enum: ['youtube', 'course', 'blog', 'docs', 'platform', 'community', 'book', 'other'],
    default: 'other',
  },
  verified: { type: Boolean, default: false },
  qualityScore: { type: Number, default: 70 },
  lastChecked: { type: Date, default: Date.now },
  sourceType: { type: String },
}, { _id: false });

/* ── Roadmap Phase sub-schema ──────────────────────────── */
const roadmapPhaseSchema = new mongoose.Schema({
  phase: { type: String, required: true },
  duration: { type: String },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner',
  },
  skills: [String],
  topics: [String],
  tools: [String],
  certifications: [String],
  practiceTasks: [String],
  projects: [String],
  resources: [resourceSchema],
  completed: { type: Boolean, default: false },
}, { _id: false });

/* ── Salary Range sub-schema ───────────────────────────── */
const salaryRangeSchema = new mongoose.Schema({
  min: { type: String },
  max: { type: String },
  currency: { type: String, default: 'INR' },
}, { _id: false });

/* ── Main Career schema ───────────────────────────────── */
const careerSchema = new mongoose.Schema({
  domain: { type: String, required: true },
  description: { type: String },
  skills: [String],
  roadmap: [roadmapPhaseSchema],
  demandScore: { type: Number, min: 0, max: 100, default: 70 },
  avgSalary: { type: String, default: '₹6-12 LPA' },
  growthRate: { type: String, default: '15%' },
  demand: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
  trendingSkills: [String],

  // ── Roadmap-specific fields ──────────────────────────
  isGeneratedRoadmap: { type: Boolean, default: false },
  salaryRange: salaryRangeSchema,
  futureScore: { type: Number, min: 0, max: 100, default: 70 },
  alternativePaths: [String],
  studyStrategy: { type: String },
  progress: {
    completedPhases: { type: Number, default: 0 },
    totalPhases: { type: Number, default: 7 },
    interviewReadiness: { type: Number, default: 0 },
    lastUpdated: { type: Date },
  },

  // ── Ownership fields (Firebase auth) ─────────────────
  userUid: { type: String, index: true },
  userEmail: { type: String, lowercase: true, trim: true, index: true },
  // Legacy field kept for backward compatibility
  userId: { type: String, ref: 'User' },

  // ── Scoring weights — how this career matches user trait scores
  weights: {
    technical: { type: Number, default: 0 },
    creative: { type: Number, default: 0 },
    analytical: { type: Number, default: 0 },
    leadership: { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
  },
}, { timestamps: true });

// Unique constraint only for generated roadmaps by same user and domain
careerSchema.index({ userUid: 1, domain: 1, isGeneratedRoadmap: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Career', careerSchema);
