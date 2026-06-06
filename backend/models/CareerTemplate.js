const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: {
    type: String,
    enum: ['course', 'youtube', 'docs', 'blog', 'community', 'book', 'platform', 'other'],
    default: 'other'
  },
  provider: String,
  url: { type: String, required: true },
  qualityScore: { type: Number, default: 0 },
  estimatedHours: { type: Number, default: 0 },
  channel: String,
  duration: String
}, { _id: false });

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
  description: String,
  githubExamples: [String],
  resources: [String],
  expectedOutcome: String
}, { _id: false });

const checkpointSchema = new mongoose.Schema({
  level: { type: Number, required: true },
  title: { type: String, required: true },
  description: String,
  estimatedTime: { type: String, default: '2 Weeks' },
  skills: [String],
  resources: [resourceSchema],
  certifications: [String],
  projects: [projectSchema],
  completionCriteria: [
    {
      title: { type: String, required: true },
      type: { type: String, enum: ['course', 'project', 'quiz', 'task'], default: 'task' }
    }
  ]
}, { _id: false });

const careerTemplateSchema = new mongoose.Schema({
  careerSlug: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  description: String,
  version: { type: String, default: '1.0' },
  estimatedDuration: { type: String, default: '6 Months' },
  checkpoints: [checkpointSchema],
  createdBy: { type: String, default: 'system' },
  popularity: { type: Number, default: 0 },
  totalUsers: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('CareerTemplate', careerTemplateSchema);
