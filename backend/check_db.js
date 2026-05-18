const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Career = require('./models/Career');

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    
    // Find the demo user or the active user
    // Since I don't know the exact ID, I'll list all generated roadmaps
    const roadmaps = await Career.find({ isGeneratedRoadmap: true });
    console.log(`Found ${roadmaps.length} generated roadmaps total:`);
    
    roadmaps.forEach(r => {
      console.log(`- ID: ${r._id}, Domain: "${r.domain}", User: ${r.userId}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
