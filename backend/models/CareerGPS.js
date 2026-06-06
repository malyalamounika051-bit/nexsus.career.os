const mongoose = require('mongoose');

const CareerGPSSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  destination: { type: String, required: true },
  currentLevel: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  progress: { type: Number, default: 0 },
  currentCheckpoint: { type: String, default: '' },
  lastActiveAt: { type: Date },

  checkpoints: [
    {
      level: Number,
      title: String,
      description: String,
      estimatedTime: { type: String, default: '2 Weeks' },
      xpReward: { type: Number, default: 250 },
      skills: [String],
      resources: [
        {
          title: String,
          type: { type: String, enum: ['course', 'youtube', 'docs', 'blog', 'platform', 'community', 'book', 'other'], default: 'other' },
          provider: String,
          url: String
        }
      ],
      certifications: [String],
      projects: [
        {
          title: String,
          difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
          description: String,
          githubExamples: [String],
          resources: [String],
          expectedOutcome: String
        }
      ],
      completionCriteria: [
        {
          title: String,
          type: { type: String, enum: ['course', 'project', 'quiz', 'task'], default: 'task' },
          completed: { type: Boolean, default: false }
        }
      ],
      completed: { type: Boolean, default: false }
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
