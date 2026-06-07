const mongoose = require('mongoose');

const opportunitySourceSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  type: { type: String },
  sourceUrl: { type: String },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  lastSync: { type: Date, default: Date.now },
  opportunitiesFetched: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('OpportunitySource', opportunitySourceSchema);
