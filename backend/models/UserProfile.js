const mongoose = require('mongoose');

const educationSchema = new mongoose.Schema({
  degree: { type: String, required: true },
  branch: String,
  college: { type: String, required: true },
  university: String,
  startYear: Number,
  endYear: Number,
  cgpa: String,
  currentSemester: Number,
  currentlyStudying: { type: Boolean, default: false }
});

const skillSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, enum: ['Programming Languages', 'Frameworks', 'Databases', 'Cloud', 'AI & ML', 'Cybersecurity', 'DevOps', 'Mobile', 'Soft Skills', 'Tools', 'Other'], default: 'Other' },
  proficiency: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' }
});

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  shortDescription: String,
  technologies: [String],
  skillsLearned: [String],
  role: String,
  teamSize: Number,
  duration: String,
  githubRepo: String,
  liveDemo: String,
  problemStatement: String,
  solution: String,
  keyFeatures: [String],
  demoVideo: String,
  awards: String,
  // AI-generated fields
  aiGenerated: {
    resumeBullets: [String],
    starAnswers: [String],
    hrQuestions: [String],
    technicalQuestions: [String],
    skillsGained: [String],
    atsKeywords: [String],
    projectSummary: String
  }
});

const experienceSchema = new mongoose.Schema({
  type: { type: String, enum: ['Internship', 'Full-time', 'Part-time', 'Freelance', 'Research', 'Volunteer'], default: 'Internship' },
  company: { type: String, required: true },
  role: { type: String, required: true },
  startDate: String,
  endDate: String,
  currentlyWorking: { type: Boolean, default: false },
  technologies: [String],
  responsibilities: [String],
  achievements: [String]
});

const certificationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  organization: String,
  issueDate: String,
  credentialId: String,
  credentialUrl: String
});

const achievementSchema = new mongoose.Schema({
  type: { type: String, enum: ['Hackathon', 'Coding Contest', 'Research Paper', 'Scholarship', 'Award', 'Open Source', 'Other'], default: 'Other' },
  title: { type: String, required: true },
  description: String,
  date: String,
  link: String
});

const activitySchema = new mongoose.Schema({
  type: { type: String, enum: ['Updated Resume', 'Added Project', 'Completed Mock Interview', 'Applied Job', 'Finished Roadmap', 'Earned Badge', 'Completed Skill', 'Added Certificate', 'Profile Updated'] },
  title: String,
  timestamp: { type: Date, default: Date.now }
});

const userProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  
  // Personal Info
  fullName: String,
  headline: String,
  profilePhoto: String,
  email: String,
  phone: String,
  location: String,
  linkedIn: String,
  github: String,
  portfolio: String,
  
  // Sections
  education: [educationSchema],
  skills: [skillSchema],
  projects: [projectSchema],
  experience: [experienceSchema],
  certifications: [certificationSchema],
  achievements: [achievementSchema],
  
  // Resume
  resumeUrl: String,
  resumeText: String,
  resumeFileName: String,
  resumeUploadedAt: Date,
  
  // Preferences
  preferences: {
    preferredLocation: String,
    workMode: { type: String, enum: ['Remote', 'Hybrid', 'Onsite', 'Any'], default: 'Any' },
    expectedSalary: String,
    preferredRoles: [String],
    preferredCompanies: [String],
    noticePeriod: String
  },
  
  // Profile Completion
  profileCompletion: {
    percentage: { type: Number, default: 0 },
    completedSections: [String],
    missingSections: [String],
    lastUpdated: { type: Date, default: Date.now }
  },
  
  // AI Analysis Cache
  aiAnalysis: {
    atsScore: { type: Number, default: 0 },
    jobReadinessScore: { type: Number, default: 0 },
    interviewReadiness: { type: Number, default: 0 },
    resumeQuality: { type: Number, default: 0 },
    projectStrength: { type: Number, default: 0 },
    skillMarketFit: { type: Number, default: 0 },
    hiringProbability: { type: String, default: 'Low' },
    strengths: [String],
    weaknesses: [String],
    recommendedSkills: [{ skill: String, estimatedSalaryIncrease: String, confidence: Number }],
    recommendedProjects: [String],
    recommendedCertifications: [String],
    salaryEstimate: String,
    marketFitScore: { type: Number, default: 0 },
    saraSuggestions: [{ message: String, impact: String, confidence: Number }],
    lastAnalyzed: Date
  },
  
  // Activity Timeline
  activities: [activitySchema]
}, { timestamps: true });

// Instance method to calculate profile completion
userProfileSchema.methods.calculateCompletion = function() {
  const sections = [
    { name: 'Personal Info', complete: !!(this.fullName && this.email && this.phone && this.location) },
    { name: 'Education', complete: this.education && this.education.length > 0 },
    { name: 'Skills', complete: this.skills && this.skills.length >= 3 },
    { name: 'Projects', complete: this.projects && this.projects.length > 0 },
    { name: 'Experience', complete: this.experience && this.experience.length > 0 },
    { name: 'Certifications', complete: this.certifications && this.certifications.length > 0 },
    { name: 'Achievements', complete: this.achievements && this.achievements.length > 0 },
    { name: 'Resume', complete: !!this.resumeUrl || !!this.resumeText },
    { name: 'LinkedIn', complete: !!this.linkedIn },
    { name: 'GitHub', complete: !!this.github },
    { name: 'Portfolio', complete: !!this.portfolio },
    { name: 'Preferences', complete: !!(this.preferences && this.preferences.preferredRoles && this.preferences.preferredRoles.length > 0) }
  ];
  const completed = sections.filter(s => s.complete);
  const missing = sections.filter(s => !s.complete);
  this.profileCompletion = {
    percentage: Math.round((completed.length / sections.length) * 100),
    completedSections: completed.map(s => s.name),
    missingSections: missing.map(s => s.name),
    lastUpdated: new Date()
  };
  return this.profileCompletion;
};

module.exports = mongoose.model('UserProfile', userProfileSchema);
