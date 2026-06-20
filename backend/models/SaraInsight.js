const mongoose = require('mongoose');

const saraInsightSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true,
    unique: true // YYYY-MM-DD
  }
}, { timestamps: true });

module.exports = mongoose.model('SaraInsight', saraInsightSchema);
