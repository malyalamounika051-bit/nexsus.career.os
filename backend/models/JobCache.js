const mongoose = require('mongoose');

const jobCacheSchema = new mongoose.Schema({
  queryKey: { 
    type: String, 
    required: true, 
    unique: true 
  },
  jobs: {
    type: Array, // Array of structured job objects
    default: []
  },
  createdAt: { 
    type: Date, 
    expires: 3600, // TTL index: documents automatically delete after 1 hour (3600 seconds)
    default: Date.now 
  }
});

module.exports = mongoose.model('JobCache', jobCacheSchema);
