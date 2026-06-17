require('dotenv').config({ path: './backend/.env' });
const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const Career = require('./models/Career');
const CareerTemplate = require('./models/CareerTemplate');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const careerCount = await Career.countDocuments({ isGeneratedRoadmap: true });
    console.log(`Cached Careers count: ${careerCount}`);
    
    const careers = await Career.find({ isGeneratedRoadmap: true }).select('domain');
    console.log('Cached domains:', careers.map(c => c.domain));
    
    const templateCount = await CareerTemplate.countDocuments({});
    console.log(`Career Templates count: ${templateCount}`);
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
