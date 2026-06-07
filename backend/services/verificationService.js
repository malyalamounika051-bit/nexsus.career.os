const axios = require('axios');
const Opportunity = require('../models/Opportunity');

/**
 * Verify URL responsiveness
 */
const verifyUrl = async (url) => {
  try {
    const response = await axios.get(url, {
      timeout: 4000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      validateStatus: () => true
    });
    
    if (response.status === 200) {
      return 'verified';
    }
    if ([404, 410, 500].includes(response.status)) {
      return 'broken';
    }
    return 'verified'; // Default verified for other status codes (e.g., 403 blocks)
  } catch (err) {
    return 'broken';
  }
};

/**
 * Sweep and verify a specific opportunity record
 */
const verifyOpportunity = async (opp) => {
  try {
    const now = new Date();
    
    // Check if past deadline
    if (opp.deadline && opp.deadline < now) {
      opp.verificationStatus = 'expired';
      opp.opportunityStatus = 'expired';
      opp.isVerified = false;
      opp.lastVerified = now;
      await opp.save();
      return opp;
    }

    // Verify URL
    const urlStatus = await verifyUrl(opp.applicationUrl);
    opp.verificationStatus = urlStatus;
    opp.isVerified = urlStatus === 'verified';
    
    if (urlStatus === 'broken') {
      opp.opportunityStatus = 'archived';
    } else {
      opp.opportunityStatus = 'active';
    }
    
    opp.lastVerified = now;
    await opp.save();
    return opp;
  } catch (err) {
    console.error(`Error verifying opportunity ID ${opp._id}:`, err.message);
    return opp;
  }
};

/**
 * Run global sweep to expire/archive entries
 */
const runVerificationSweep = async () => {
  console.log('🧹 Verification Sweeper: Checking opportunities freshness...');
  try {
    const opportunities = await Opportunity.find({ opportunityStatus: { $ne: 'archived' } });
    let updatedCount = 0;
    
    for (const opp of opportunities) {
      await verifyOpportunity(opp);
      updatedCount++;
    }
    console.log(`🧹 Verification Sweeper: Verification completed for ${updatedCount} opportunities.`);
    return { success: true, count: updatedCount };
  } catch (err) {
    console.error('Sweep Verification Error:', err.message);
    return { success: false, error: err.message };
  }
};

module.exports = {
  verifyUrl,
  verifyOpportunity,
  runVerificationSweep
};
