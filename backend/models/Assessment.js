const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: { type: Number, required: true },
  question: { type: String },
  selectedOption: { type: String },
  value: { type: String },
}, { _id: false });

const careerResultSchema = new mongoose.Schema({
  career: { type: String },
  match: { type: Number },        // percentage 0-100
  domain: { type: String },
  salary: { type: String },
  demand: { type: String },       // 'High' | 'Medium' | 'Low'
  skills: [String],
}, { _id: false });

const assessmentSchema = new mongoose.Schema({
  userId: {
    type: String,
    ref: 'User',
    required: true,
  },
  answers: [answerSchema],
  scores: {
    technical: { type: Number, default: 0 },
    creative: { type: Number, default: 0 },
    analytical: { type: Number, default: 0 },
    leadership: { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
  },
  result: [careerResultSchema],
  topCareer: { type: String },
  careerDNA: {
    archetype: { type: String },
    strengths: [String],
    weaknesses: [String],
    workEnvironment: { type: String },
    learningStyle: { type: String },
  },
}, { timestamps: true });

module.exports = mongoose.model('Assessment', assessmentSchema);
