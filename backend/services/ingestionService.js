const Opportunity = require('../models/Opportunity');
const OpportunitySource = require('../models/OpportunitySource');
const { verifyUrl } = require('./verificationService');
const crypto = require('crypto');

// Import connectors
const linkedin = require('./connectors/linkedin');
const devpost = require('./connectors/devpost');
const kaggle = require('./connectors/kaggle');
const openSource = require('./connectors/openSource');
const scholarship = require('./connectors/scholarship');

const escapeRegex = (str = '') => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Generate a URL friendly slug
 */
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '') + '-' + crypto.randomBytes(3).toString('hex');
};

/**
 * Deduplicate & fuzzy merging
 */
const detectAndMergeDuplicate = async (oppData) => {
  // 1. Direct URL check
  let existing = await Opportunity.findOne({ applicationUrl: oppData.applicationUrl });
  if (existing) {
    return existing;
  }

  // 2. Fuzzy checks (same org, high similarity in title)
  const matches = await Opportunity.find({
    organization: { $regex: new RegExp('^' + escapeRegex(oppData.organization) + '$', 'i') }
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

    if (similarity >= 0.75) {
      if ((oppData.sourceScore || 70) > (match.sourceScore || 70)) {
        match.source = oppData.source;
        match.sourceScore = oppData.sourceScore;
        match.applicationUrl = oppData.applicationUrl;
      }
      
      match.requiredSkills = Array.from(new Set([...(match.requiredSkills || []), ...(oppData.requiredSkills || [])]));
      match.tags = Array.from(new Set([...(match.tags || []), ...(oppData.tags || [])]));
      match.lastChecked = new Date();
      await match.save();
      return match;
    }
  }

  return null;
};

/**
 * Sync Source log update helper
 */
const updateSourceSync = async (sourceName, fetchedCount) => {
  try {
    await OpportunitySource.findOneAndUpdate(
      { name: sourceName },
      {
        $set: { lastSync: new Date(), status: 'active', sourceUrl: 'https://careers.google.com' },
        $inc: { opportunitiesFetched: fetchedCount }
      },
      { upsert: true }
    );
  } catch (err) {
    console.error(`Error updating source sync for ${sourceName}:`, err.message);
  }
};

/**
 * Ingestion pipe manager
 */
const runIngestion = async () => {
  console.log('🚀 Ingesting Opportunity Radar sources...');
  
  const sources = [
    { name: 'LinkedIn', fetcher: linkedin.fetchOpportunities },
    { name: 'Devpost', fetcher: devpost.fetchOpportunities },
    { name: 'Kaggle', fetcher: kaggle.fetchOpportunities },
    { name: 'OpenSource', fetcher: openSource.fetchOpportunities },
    { name: 'Scholarship', fetcher: scholarship.fetchOpportunities }
  ];

  let totalSaved = 0;

  for (const src of sources) {
    try {
      console.log(`Running crawler for: ${src.name}`);
      const rawOpps = await src.fetcher();
      let savedForSource = 0;
      
      for (const opp of rawOpps) {
        // Normalization
        let type = (opp.type || 'hackathon').toLowerCase().trim();
        if (type.includes('hack')) type = 'hackathon';
        else if (type.includes('scholar') || type.includes('fellow')) type = 'scholarship';
        else if (type.includes('compete') || type.includes('competition') || type.includes('challenge')) type = 'competition';
        else if (type.includes('open') || type.includes('source')) type = 'open-source';
        else if (type.includes('research')) type = 'research';
        else if (type.includes('course') || type.includes('learn') || type.includes('class')) type = 'course';
        else if (type.includes('certif')) type = 'certification';
        else if (type.includes('quiz') || type.includes('test')) type = 'quiz';
        else type = 'hackathon';
        opp.type = type;

        const duplicate = await detectAndMergeDuplicate(opp);
        if (duplicate) {
          continue;
        }

        // URL Check
        const verificationStatus = await verifyUrl(opp.applicationUrl);
        const isVerified = verificationStatus === 'verified';
        
        // Deadlines mapping
        const deadline = opp.registrationDeadline ? new Date(opp.registrationDeadline) : (opp.deadline ? new Date(opp.deadline) : null);
        let daysRemaining = 0;
        if (deadline) {
          daysRemaining = Math.max(0, Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24)));
        }

        const newOpp = new Opportunity({
          title: opp.title,
          organization: opp.organization,
          type: opp.type,
          description: opp.description,
          deadline,
          applicationUrl: opp.applicationUrl,
          eligibility: opp.eligibility,
          requiredSkills: opp.requiredSkills || [],
          preferredSkills: opp.preferredSkills || [],
          location: opp.location || 'Remote',
          remote: opp.remote !== undefined ? opp.remote : true,
          tags: opp.tags || [],
          source: opp.source || src.name,
          sourceType: opp.sourceType || 'api',
          sourceScore: opp.sourceScore || 80,
          verificationStatus,
          isVerified,
          lastChecked: new Date(),
          careerTracks: opp.careerTracks || [opp.type],
          difficulty: opp.difficultyLevel || opp.difficulty || 'Medium',
          daysRemaining,
          isFeatured: opp.isFeatured || false,
          slug: slugify(opp.title),
          opportunityStatus: (deadline && deadline < new Date()) ? 'expired' : 'active'
        });

        await newOpp.save();
        savedForSource++;
        totalSaved++;
      }
      
      await updateSourceSync(src.name, savedForSource);
      console.log(`Crawler complete for ${src.name}: Synced ${savedForSource} new opportunities.`);
    } catch (err) {
      console.error(`Error ingesting source ${src.name}:`, err.message);
    }
  }

  console.log(`✅ Global Ingestion finished. Saved ${totalSaved} opportunities overall.`);
  return { success: true, saved: totalSaved };
};

module.exports = {
  runIngestion
};
