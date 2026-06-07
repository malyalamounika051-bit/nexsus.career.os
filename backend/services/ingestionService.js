const OpportunityMaster = require('../models/OpportunityMaster');
const axios = require('axios');

// Import connectors
const linkedin = require('./connectors/linkedin');
const devpost = require('./connectors/devpost');
const kaggle = require('./connectors/kaggle');
const openSource = require('./connectors/openSource');
const scholarship = require('./connectors/scholarship');

const escapeRegex = (str = '') => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Verify if the application URL works
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
    return 'verified'; // Default to verified if some rate limits or blocks like 403 happen but not structural 404/500
  } catch (err) {
    return 'broken';
  }
};

/**
 * Intelligent Deduplication & Merging against DB
 */
const detectAndMergeDuplicate = async (oppData) => {
  // 1. Direct URL check
  let existing = await OpportunityMaster.findOne({ applicationUrl: oppData.applicationUrl });
  if (existing) {
    return existing;
  }

  // 2. Similarity search
  const matches = await OpportunityMaster.find({
    organization: { $regex: new RegExp('^' + escapeRegex(oppData.organization) + '$', 'i') },
    type: oppData.type
  });

  for (const match of matches) {
    const words1 = new Set(match.title.toLowerCase().split(/\s+/));
    const words2 = new Set(oppData.title.toLowerCase().split(/\s+/));
    
    let intersection = 0;
    words1.forEach(w => {
      if (words2.has(w)) intersection++;
    });
    
    const maxWords = Math.max(words1.size, words2.size);
    const similarity = intersection / maxWords;

    if (similarity >= 0.8) {
      // Merge: prefer higher trust score source
      if ((oppData.sourceScore || 70) > (match.sourceScore || 70)) {
        match.source = oppData.source;
        match.sourceScore = oppData.sourceScore;
        match.applicationUrl = oppData.applicationUrl;
      }
      
      const mergedSkills = Array.from(new Set([...(match.requiredSkills || []), ...(oppData.requiredSkills || [])]));
      match.requiredSkills = mergedSkills;
      
      const mergedTags = Array.from(new Set([...(match.tags || []), ...(oppData.tags || [])]));
      match.tags = mergedTags;
      
      match.lastVerified = new Date();
      await match.save();
      return match;
    }
  }

  return null;
};

/**
 * Ingestion pipeline coordinator
 */
const runIngestion = async () => {
  console.log('🚀 Starting Opportunity Radar Ingestion Pipeline...');
  
  const fetchers = [
    linkedin.fetchOpportunities(),
    devpost.fetchOpportunities(),
    kaggle.fetchOpportunities(),
    openSource.fetchOpportunities(),
    scholarship.fetchOpportunities()
  ];
  
  const settled = await Promise.allSettled(fetchers);
  let rawOpportunities = [];
  
  settled.forEach((res, idx) => {
    if (res.status === 'fulfilled' && Array.isArray(res.value)) {
      rawOpportunities = rawOpportunities.concat(res.value);
    } else {
      console.error(`Fetcher ${idx} failed to load:`, res.reason);
    }
  });

  console.log(`Aggregated ${rawOpportunities.length} raw opportunities. Processing & verifying...`);
  
  let savedCount = 0;
  
  for (const opp of rawOpportunities) {
    try {
      // Normalize type to match schema enum
      let type = (opp.type || 'job').toLowerCase().trim();
      if (type.includes('intern')) type = 'internship';
      else if (type.includes('hack')) type = 'hackathon';
      else if (type.includes('scholar') || type.includes('fellow')) type = 'scholarship';
      else if (type.includes('compete') || type.includes('competition') || type.includes('challenge')) type = 'competition';
      else if (type.includes('open') || type.includes('source')) type = 'open-source';
      else if (type.includes('hiring') || type.includes('drive')) type = 'hiring-drive';
      else if (type.includes('research')) type = 'research';
      else if (type.includes('job') || type.includes('full') || type.includes('work') || type.includes('engineer') || type.includes('developer')) type = 'job';
      else type = 'job';
      opp.type = type;

      const duplicate = await detectAndMergeDuplicate(opp);
      if (duplicate) {
        console.log(`Merged duplicate opportunity: ${opp.title}`);
        continue;
      }

      // Live verification of URL
      const verificationStatus = await verifyUrl(opp.applicationUrl);
      const isVerified = verificationStatus === 'verified';
      
      const registrationDeadline = opp.registrationDeadline ? new Date(opp.registrationDeadline) : null;
      const submissionDeadline = opp.submissionDeadline ? new Date(opp.submissionDeadline) : null;
      
      // Compute default popularityScore and difficultyLevel
      const popularityScore = Math.floor(Math.random() * 40) + 60; // 60-100
      
      // Calculate freshnessScore
      let freshnessScore = 100;
      if (registrationDeadline) {
        const daysToDeadline = (registrationDeadline - new Date()) / (1000 * 60 * 60 * 24);
        if (daysToDeadline < 0) freshnessScore = 0;
        else if (daysToDeadline < 3) freshnessScore = 50;
        else if (daysToDeadline < 7) freshnessScore = 80;
      }
      
      const newOpp = new OpportunityMaster({
        ...opp,
        registrationDeadline,
        submissionDeadline,
        isVerified,
        verificationStatus,
        freshnessScore,
        popularityScore,
        lastVerified: new Date()
      });
      
      await newOpp.save();
      savedCount++;
    } catch (err) {
      console.error(`Failed to process opportunity ${opp.title}:`, err.message);
    }
  }

  console.log(`✅ Ingestion process complete. Saved ${savedCount} new opportunities.`);
  return { success: true, processed: rawOpportunities.length, saved: savedCount };
};

module.exports = {
  runIngestion,
  verifyUrl
};
