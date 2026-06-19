const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const dns = require('dns');

// Force Google DNS — system resolver blocks SRV queries on Windows
dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config({ path: path.join(__dirname, '.env') });

const Opportunity = require('./models/Opportunity');
const UserOpportunity = require('./models/UserOpportunity');

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB successfully!');
    
    const count = await Opportunity.countDocuments();
    const activeCount = await Opportunity.countDocuments({ opportunityStatus: 'active' });
    const verifiedCount = await Opportunity.countDocuments({ isVerified: true });
    
    console.log(`Total Opportunities in DB: ${count}`);
    console.log(`Active Opportunities in DB: ${activeCount}`);
    console.log(`Verified Opportunities in DB: ${verifiedCount}`);
    
    // Sample one
    const sample = await Opportunity.findOne();
    if (sample) {
      console.log('Sample opportunity:');
      console.log(JSON.stringify(sample, null, 2));
    }
    
    // Check if there are user interactions
    const userOpps = await UserOpportunity.countDocuments();
    console.log(`Total User-Opportunity interactions in DB: ${userOpps}`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error in check:', err);
    process.exit(1);
  }
}

check();
