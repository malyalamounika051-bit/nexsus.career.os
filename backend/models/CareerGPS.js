const mongoose = require('mongoose');

const completedCriteriaSchema = new mongoose.Schema({
  title: { type: String, required: true },
  completed: { type: Boolean, default: false }
}, { _id: false });

const completedCheckpointSchema = new mongoose.Schema({
  level: { type: Number, required: true },
  completed: { type: Boolean, default: false },
  completedCriteria: [completedCriteriaSchema]
}, { _id: false });

const CareerGPSSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'CareerTemplate', required: true },
  destination: { type: String, required: true },
  currentLevel: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  progress: { type: Number, default: 0 },
  currentCheckpoint: { type: String, default: '' },
  lastActiveAt: { type: Date },
  completedCheckpoints: [completedCheckpointSchema],
  badges: [
    {
      name: String,
      unlockedAt: { type: Date, default: Date.now }
    }
  ],
  projects: [
    {
      projectName: String,
      githubUrl: String,
      description: String,
      status: { type: String, enum: ['submitted', 'completed'], default: 'submitted' },
      submittedAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

CareerGPSSchema.index({ userId: 1, templateId: 1 }, { unique: true });

module.exports = mongoose.model('CareerGPS', CareerGPSSchema);
