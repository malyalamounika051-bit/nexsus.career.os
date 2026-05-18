const mongoose = require('mongoose');

const adviceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  author: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    default: '',
  },
  content: {
    type: String,
    required: [true, 'Advice content is required'],
    minlength: [10, 'Content must be at least 10 characters'],
    maxlength: [1000, 'Content cannot exceed 1000 characters'],
  },
  tags: {
    type: [String],
    default: [],
  },
  likes: {
    type: Number,
    default: 0,
  },
  likedBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }
  ],
}, { timestamps: true });

module.exports = mongoose.model('Advice', adviceSchema);
