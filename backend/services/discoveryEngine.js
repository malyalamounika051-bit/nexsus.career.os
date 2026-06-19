/**
 * Discovery Engine – AI-Powered Opportunity Finder
 * -------------------------------------------------
 * Replaces the legacy static connectors with a Gemini AI-driven pipeline
 * that discovers REAL, currently-active opportunities across all categories.
 *
 * Pipeline per category:
 *   1. Prompt Gemini for structured JSON (5 opportunities)
 *   2. Parse & validate the AI response
 *   3. Verify each URL via verificationService
 *   4. De-duplicate against existing DB entries (by applicationUrl)
 *   5. Insert verified, non-duplicate entries into MongoDB
 *
 * @module services/discoveryEngine
 */

const { callGeminiDirectly } = require('../utils/geminiClient');
const { parseStructuredJson } = require('../utils/jsonParser');
const { verifyUrl } = require('./verificationService');
const Opportunity = require('../models/Opportunity');

/**
 * All opportunity categories the engine will scan.
 * Mirrors the Opportunity model's `type` enum.
 * @type {string[]}
 */
const ALL_CATEGORIES = [
  'hackathon',
  'scholarship',
  'competition',
  'open-source',
  'research',
  'course',
  'certification',
  'quiz',
  'fellowship',
  'innovation',
  'coding-challenge',
  'startup-challenge'
];

/**
 * Build the Gemini prompt for a given opportunity category.
 * Asks for exactly 5 entries with real, verifiable data.
 *
 * @param {string} category - The opportunity type to search for
 * @returns {string} The formatted prompt string
 */
const buildDiscoveryPrompt = (category) => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  return `You are an expert career-opportunity researcher.
Find 5 REAL, currently-active "${category}" opportunities that students or early-career professionals can apply to RIGHT NOW (as of ${today}).

Requirements:
- Every opportunity MUST be real and currently accepting applications
- Every URL MUST be a direct, working link to the application or info page
- Deadlines must be in the future (after ${today})
- Include well-known organizations when possible

Return ONLY a JSON array (no markdown, no explanation) with this exact schema:
[
  {
    "title": "Opportunity Title",
    "organization": "Organization Name",
    "type": "${category}",
    "description": "Brief 1-2 sentence description",
    "deadline": "YYYY-MM-DD",
    "applicationUrl": "https://...",
    "eligibility": "Who can apply",
    "requiredSkills": ["Skill1", "Skill2"],
    "tags": ["tag1", "tag2"],
    "location": "Remote or City, Country",
    "remote": true,
    "benefits": ["Benefit 1", "Benefit 2"],
    "difficulty": "Easy | Medium | Hard",
    "estimatedCommitment": "e.g. 2 weeks, 3 months",
    "prizePool": "e.g. $10,000 or N/A",
    "source": "ai-discovery"
  }
]

Important: Return ONLY the raw JSON array. No code fences, no commentary.`;
};

/**
 * Discover opportunities for a single category using Gemini AI.
 *
 * Workflow:
 *   - Call Gemini with a crafted discovery prompt
 *   - Parse the structured JSON response
 *   - Verify each URL's reachability
 *   - Skip entries with broken URLs
 *   - Skip entries whose applicationUrl already exists in the DB
 *   - Insert all remaining valid entries
 *
 * @param {string} category - The opportunity category to discover (e.g. 'hackathon')
 * @returns {Promise<number>} Count of newly inserted opportunities (0 on failure)
 */
const discoverOpportunities = async (category) => {
  try {
    console.log(`🔍 Discovery Engine: Searching for "${category}" opportunities...`);

    // --- Step 1: Call Gemini AI ---
    const prompt = buildDiscoveryPrompt(category);
    const aiResponse = await callGeminiDirectly({ prompt, temperature: 0.4, maxTokens: 4096 });

    // --- Step 2: Parse structured JSON ---
    const opportunities = parseStructuredJson(aiResponse.text);

    if (!Array.isArray(opportunities) || opportunities.length === 0) {
      console.warn(`⚠️ Discovery Engine: No opportunities parsed for "${category}".`);
      return 0;
    }

    console.log(`📋 Discovery Engine: Parsed ${opportunities.length} candidates for "${category}".`);

    let insertedCount = 0;

    for (const opp of opportunities) {
      try {
        // --- Step 3: Validate required fields ---
        if (!opp.title || !opp.organization || !opp.applicationUrl) {
          console.warn(`⚠️ Skipping entry with missing required fields: "${opp.title || 'unknown'}"`);
          continue;
        }

        // --- Step 4: Verify URL reachability ---
        const urlStatus = await verifyUrl(opp.applicationUrl);
        if (urlStatus === 'broken') {
          console.warn(`🔗 Broken URL, skipping: ${opp.applicationUrl}`);
          continue;
        }

        // --- Step 5: De-duplicate by applicationUrl ---
        const exists = await Opportunity.findOne({ applicationUrl: opp.applicationUrl });
        if (exists) {
          console.log(`♻️ Duplicate skipped: "${opp.title}"`);
          continue;
        }

        // --- Step 6: Prepare & insert the document ---
        const newOpp = new Opportunity({
          title: opp.title,
          organization: opp.organization,
          type: opp.type || category,
          description: opp.description || '',
          deadline: opp.deadline ? new Date(opp.deadline) : null,
          applicationUrl: opp.applicationUrl,
          eligibility: opp.eligibility || '',
          requiredSkills: Array.isArray(opp.requiredSkills) ? opp.requiredSkills : [],
          preferredSkills: [],
          tags: Array.isArray(opp.tags) ? opp.tags : [],
          location: opp.location || 'Remote',
          remote: opp.remote !== false,
          benefits: Array.isArray(opp.benefits) ? opp.benefits : [],
          difficulty: ['Easy', 'Medium', 'Hard'].includes(opp.difficulty) ? opp.difficulty : 'Medium',
          estimatedCommitment: opp.estimatedCommitment || '',
          prizePool: opp.prizePool || '',
          source: 'ai-discovery',
          sourceType: 'gemini',
          sourceScore: 65,
          verificationStatus: 'verified',
          isVerified: true,
          lastVerified: new Date(),
          opportunityStatus: 'active',
          category: category
        });

        await newOpp.save();
        insertedCount++;
        console.log(`✅ Inserted: "${opp.title}" (${opp.organization})`);
      } catch (entryErr) {
        console.error(`❌ Error processing entry "${opp.title || 'unknown'}":`, entryErr.message);
        // Continue with remaining entries
      }
    }

    console.log(`🏁 Discovery Engine: Inserted ${insertedCount} new "${category}" opportunities.`);
    return insertedCount;
  } catch (err) {
    console.error(`❌ Discovery Engine failed for "${category}":`, err.message);
    return 0;
  }
};

/**
 * Run discovery across ALL supported opportunity categories sequentially.
 * Sequential execution avoids rate-limiting issues with the AI provider.
 *
 * @returns {Promise<{ totalInserted: number, results: Object.<string, number> }>}
 *   totalInserted – grand total of new entries across all categories
 *   results       – per-category breakdown { category: count }
 */
const discoverAllCategories = async () => {
  console.log('🚀 Discovery Engine: Starting full discovery sweep across all categories...');

  const results = {};
  let totalInserted = 0;

  for (const category of ALL_CATEGORIES) {
    const count = await discoverOpportunities(category);
    results[category] = count;
    totalInserted += count;
  }

  console.log(`🏁 Discovery Engine: Full sweep complete. Total new entries: ${totalInserted}`);
  return { totalInserted, results };
};

module.exports = {
  discoverOpportunities,
  discoverAllCategories,
  ALL_CATEGORIES
};
