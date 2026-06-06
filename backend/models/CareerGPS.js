const mongoose = require('mongoose');

const CareerGPSSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  destination: { type: String, required: true },
  currentLevel: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  progress: { type: Number, default: 0 },
  currentCheckpoint: { type: String, default: '' },

  checkpoints: [
    {
      level: Number,
      title: String,
      description: String,
      completed: { type: Boolean, default: false },
      rewardXP: { type: Number, default: 250 },
      tasks: [
        {
          title: String,
          completed: { type: Boolean, default: false }
        }
      ]
    }
  ],

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

module.exports = mongoose.model('CareerGPS', CareerGPSSchema);
