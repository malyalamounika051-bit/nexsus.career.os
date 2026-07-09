const mongoose = require('mongoose');

/* ── Resource sub-schema ───────────────────────────────── */
const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
  verifiedUrl: { type: String },
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
  provider: { type: String, default: 'Community' },
  difficulty: { type: String, default: 'Beginner' },
  isFree: { type: Boolean, default: true },
  duration: { type: String, default: 'Self-paced' },
  description: { type: String, default: '' },
  isOfficial: { type: Boolean, default: false },
  verified: { type: Boolean, default: true },
  lastChecked: { type: Date, default: Date.now },
  lastVerifiedDate: { type: Date, default: Date.now }
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
  salaryRange: salaryRangeSchema,
  studyStrategy: { type: String },
  alternativePaths: [String],
  userUid: { type: String, required: true, index: true },
  userId: { type: String, index: true }, // legacy support
  userEmail: { type: String },
  isGeneratedRoadmap: { type: Boolean, default: false },
  progress: {
    completedPhases: { type: Number, default: 0 },
    totalPhases: { type: Number, default: 7 },
    lastUpdated: { type: Date, default: Date.now },
  },
}, { timestamps: true });

module.exports = mongoose.model('Career', careerSchema);
