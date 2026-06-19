const Opportunity = require('../models/Opportunity');
const OpportunitySource = require('../models/OpportunitySource');
const { verifyUrl } = require('./verificationService');
const crypto = require('crypto');

/**
 * Opportunity Radar v2 — Ingestion Pipeline Manager
 * 
 * Two-tier ingestion:
 * Tier 1: Curated seed database (120+ verified opportunities — guaranteed content)
 * Tier 2: AI-powered discovery engine (finds new real opportunities)
 */

// Lazy-load services to avoid circular dependency issues at startup
let seedModule = null;
let discoveryModule = null;

const getSeedModule = () => {
  if (!seedModule) seedModule = require('./opportunitySeed');
  return seedModule;
};

const getDiscoveryModule = () => {
  if (!discoveryModule) discoveryModule = require('./discoveryEngine');
  return discoveryModule;
};

const escapeRegex = (str = '') => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Generate a URL-friendly slug
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
        $set: { lastSync: new Date(), status: 'active' },
        $inc: { opportunitiesFetched: fetchedCount }
      },
      { upsert: true }
    );
  } catch (err) {
    console.error(`Error updating source sync for ${sourceName}:`, err.message);
  }
};

/**
 * Main Ingestion Pipeline
 * 
 * Step 1: Seed curated opportunities (idempotent — skips existing)
 * Step 2: Run AI discovery for fresh opportunities (optional, may fail gracefully)
 */
const runIngestion = async () => {
  console.log('🚀 Opportunity Radar v2: Starting ingestion pipeline...');
  
  let totalSeeded = 0;
  let totalDiscovered = 0;

  // ═══ TIER 1: Curated Seed Database ═══
  try {
    console.log('📦 Tier 1: Seeding curated opportunity database...');
    const { seedCuratedOpportunities } = getSeedModule();
    const seedResult = await seedCuratedOpportunities();
    totalSeeded = seedResult.inserted || 0;
    console.log(`📦 Tier 1 complete: ${totalSeeded} new opportunities seeded.`);
    await updateSourceSync('CuratedSeed', totalSeeded);
  } catch (err) {
    console.error('❌ Tier 1 seed error:', err.message);
  }

  // ═══ TIER 2: AI-Powered Discovery ═══
  try {
    console.log('🔍 Tier 2: Running AI discovery engine...');
    const { discoverAllCategories } = getDiscoveryModule();
    const discoveryResult = await discoverAllCategories();
    totalDiscovered = discoveryResult.total || 0;
    console.log(`🔍 Tier 2 complete: ${totalDiscovered} new opportunities discovered.`);
    await updateSourceSync('AIDiscovery', totalDiscovered);
  } catch (err) {
    // AI discovery is optional — seed database guarantees content
    console.error('⚠️ Tier 2 discovery error (non-fatal):', err.message);
  }

  const totalNew = totalSeeded + totalDiscovered;
  console.log(`✅ Ingestion pipeline finished. Total new: ${totalNew} (Seeded: ${totalSeeded}, Discovered: ${totalDiscovered})`);
  
  return { success: true, saved: totalNew, seeded: totalSeeded, discovered: totalDiscovered };
};

module.exports = {
  runIngestion,
  detectAndMergeDuplicate,
  slugify,
  updateSourceSync
};
