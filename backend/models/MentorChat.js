const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'model'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const mentorChatSchema = new mongoose.Schema({
  userUid: { type: String, required: true, unique: true, index: true },
  messages: [messageSchema]
}, { timestamps: true });

module.exports = mongoose.model('MentorChat', mentorChatSchema);
