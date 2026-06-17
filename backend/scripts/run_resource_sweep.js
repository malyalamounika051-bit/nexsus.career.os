process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');

// Force DNS on Windows
dns.setServers(['8.8.8.8', '8.8.4.4']);

const Career = require('../models/Career');
const CareerTemplate = require('../models/CareerTemplate');
const {
  validateUrl,
  validateYouTube,
  validateGitHub,
  calculateQualityScore,
  repairResource
} = require('../utils/resourceVerifier');

const VALID_CATEGORIES = ['youtube', 'course', 'blog', 'docs', 'platform', 'community', 'book', 'other'];

function normalizeCategory(cat) {
  if (!cat) return 'other';
  const c = String(cat).toLowerCase().trim();
  if (VALID_CATEGORIES.includes(c)) return c;
  if (c === 'github' || c === 'repo' || c === 'repository') return 'platform';
  if (c === 'video' || c === 'tutorial') return 'youtube';
  if (c === 'article' || c === 'documentation' || c === 'site') return 'docs';
  return 'other';
}

async function runSweep() {
  const report = {
    totalRoadmaps: 0,
    totalResourcesChecked: 0,
    brokenLinksFound: 0,
    youtubeVideosReplaced: 0,
    certificationsFixed: 0,
    githubReposFixed: 0,
    resourcesUpgraded: 0,
    duplicatesDetected: 0
  };

  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected.');

    // 1. Process Career collection (User-generated & cached roadmaps)
    const careers = await Career.find({});
    console.log(`📦 Found ${careers.length} Career documents.`);
    report.totalRoadmaps += careers.length;

    for (const career of careers) {
      console.log(`\n➡️ Processing Career Roadmap: "${career.domain}" (${career._id})`);
      const seenUrls = new Set();
      let wasModified = false;

      if (career.roadmap && Array.isArray(career.roadmap)) {
        for (const phase of career.roadmap) {
          if (!phase.resources || !Array.isArray(phase.resources)) continue;

          for (let i = 0; i < phase.resources.length; i++) {
            const res = phase.resources[i];
            report.totalResourcesChecked++;
            console.log(`  - Checking [${res.type}] "${res.title}" - URL: ${res.url}`);

            // A. Duplicate Detection
            if (seenUrls.has(res.url)) {
              console.log(`  ⚠️ Duplicate resource detected for: ${res.url}`);
              report.duplicatesDetected++;
              // Auto-repair to replace the duplicate
              const repaired = await repairResource(res, career.domain, phase.phase);
              res.title = repaired.title;
              res.url = repaired.url;
              res.type = repaired.type || res.type;
              res.category = normalizeCategory(repaired.category || res.category);
              res.provider = repaired.provider || res.provider || '';
              report.resourcesUpgraded++;
              wasModified = true;
            }
            seenUrls.add(res.url);

            // B. Validation
            let isValid = true;
            let reason = '';
            const isYouTube = res.url.includes('youtube.com') || res.url.includes('youtu.be') || res.category === 'youtube';

            if (isYouTube) {
              const check = await validateYouTube(res.url);
              if (!check.valid) {
                isValid = false;
                reason = check.reason;
                report.youtubeVideosReplaced++;
              }
            } else if (res.url.includes('github.com')) {
              const check = await validateGitHub(res.url);
              if (!check.valid) {
                isValid = false;
                reason = check.reason;
                report.githubReposFixed++;
              }
            } else {
              const check = await validateUrl(res.url);
              if (!check.valid) {
                isValid = false;
                reason = check.reason;
                if (res.type === 'certification' || res.category === 'course') {
                  report.certificationsFixed++;
                }
              }
            }

            // C. Auto-Repair and updates
            if (!isValid) {
              console.log(`  ❌ Broken Link Found: ${res.url}. Reason: ${reason}`);
              report.brokenLinksFound++;

              const repaired = await repairResource(res, career.domain, phase.phase);
              res.title = repaired.title;
              res.url = repaired.url;
              res.type = repaired.type || res.type;
              res.category = normalizeCategory(repaired.category || res.category);
              res.provider = repaired.provider || res.provider || '';
              report.resourcesUpgraded++;
              wasModified = true;
            }

            // D. Set verification metadata & scores
            res.verified = true;
            res.qualityScore = calculateQualityScore(res);
            res.lastChecked = new Date();
            res.sourceType = isYouTube ? 'youtube' : res.url.includes('github.com') ? 'github' : 'web';
          }
        }
      }

      if (wasModified) {
        career.markModified('roadmap');
        await career.save();
        console.log(`💾 Saved updated roadmap for "${career.domain}"`);
      }
    }

    // 2. Process CareerTemplate collection
    const templates = await CareerTemplate.find({});
    console.log(`\n📦 Found ${templates.length} CareerTemplate documents.`);
    report.totalRoadmaps += templates.length;

    for (const template of templates) {
      console.log(`\n➡️ Processing Career Template: "${template.title}" (${template.careerSlug})`);
      const seenUrls = new Set();
      let wasModified = false;

      if (template.checkpoints && Array.isArray(template.checkpoints)) {
        for (const checkpoint of template.checkpoints) {
          // Check checkpoints.resources
          if (checkpoint.resources && Array.isArray(checkpoint.resources)) {
            for (let i = 0; i < checkpoint.resources.length; i++) {
              const res = checkpoint.resources[i];
              report.totalResourcesChecked++;
              console.log(`  - Checking template resource: "${res.title}" - URL: ${res.url}`);

              if (seenUrls.has(res.url)) {
                console.log(`  ⚠️ Duplicate resource detected in template: ${res.url}`);
                report.duplicatesDetected++;
                const repaired = await repairResource(res, template.title, checkpoint.title);
                res.title = repaired.title;
                res.url = repaired.url;
                res.type = repaired.type || res.type;
                res.provider = repaired.provider || res.provider || '';
                report.resourcesUpgraded++;
                wasModified = true;
              }
              seenUrls.add(res.url);

              let isValid = true;
              let reason = '';
              const isYouTube = res.url.includes('youtube.com') || res.url.includes('youtu.be') || res.type === 'youtube';

              if (isYouTube) {
                const check = await validateYouTube(res.url);
                if (!check.valid) {
                  isValid = false;
                  reason = check.reason;
                  report.youtubeVideosReplaced++;
                }
              } else {
                const check = await validateUrl(res.url);
                if (!check.valid) {
                  isValid = false;
                  reason = check.reason;
                  if (res.type === 'certification' || res.type === 'course') {
                    report.certificationsFixed++;
                  }
                }
              }

              if (!isValid) {
                console.log(`  ❌ Broken Link Found in Template: ${res.url}. Reason: ${reason}`);
                report.brokenLinksFound++;
                const repaired = await repairResource(res, template.title, checkpoint.title);
                res.title = repaired.title;
                res.url = repaired.url;
                res.type = repaired.type || res.type;
                res.provider = repaired.provider || res.provider || '';
                report.resourcesUpgraded++;
                wasModified = true;
              }

              res.verified = true;
              res.qualityScore = calculateQualityScore(res);
              res.lastChecked = new Date();
              res.sourceType = isYouTube ? 'youtube' : 'web';
            }
          }

          // Check checkpoints.projects for githubExamples
          if (checkpoint.projects && Array.isArray(checkpoint.projects)) {
            for (const proj of checkpoint.projects) {
              if (proj.githubExamples && Array.isArray(proj.githubExamples)) {
                for (let j = 0; j < proj.githubExamples.length; j++) {
                  const repoUrl = proj.githubExamples[j];
                  report.totalResourcesChecked++;
                  console.log(`  - Checking GitHub Example: ${repoUrl}`);

                  const check = await validateGitHub(repoUrl);
                  if (!check.valid) {
                    console.log(`  ❌ Broken/Private GitHub Repo: ${repoUrl}`);
                    report.brokenLinksFound++;
                    report.githubReposFixed++;
                    
                    // Ask Gemini for a working public github project example
                    const prompt = `Find a working, popular, and public GitHub repository example for the project: "${proj.title}" in the field of "${template.title}". Return ONLY the raw public repository URL.`;
                    try {
                      const response = await callGeminiDirectly({ prompt, temperature: 0.3 });
                      const newUrl = response.text.trim();
                      if (newUrl.startsWith('http')) {
                        console.log(`  ⚙️ Replaced GitHub repo with: ${newUrl}`);
                        proj.githubExamples[j] = newUrl;
                        report.resourcesUpgraded++;
                        wasModified = true;
                      }
                    } catch (gErr) {
                      console.error(`Failed to replace GitHub example with AI: ${gErr.message}`);
                    }
                  }
                }
              }
            }
          }
        }
      }

      if (wasModified) {
        template.markModified('checkpoints');
        await template.save();
        console.log(`💾 Saved updated template for "${template.title}"`);
      }
    }

    console.log('\n=========================================');
    console.log('📝 ROADMAP RESOURCE VERIFICATION REPORT');
    console.log('=========================================');
    console.log(`Total Roadmaps:             ${report.totalRoadmaps}`);
    console.log(`Total Resources Checked:    ${report.totalResourcesChecked}`);
    console.log(`Broken Links Found:         ${report.brokenLinksFound}`);
    console.log(`YouTube Videos Replaced:    ${report.youtubeVideosReplaced}`);
    console.log(`Certifications Fixed:       ${report.certificationsFixed}`);
    console.log(`GitHub Repositories Fixed:  ${report.githubReposFixed}`);
    console.log(`Resources Upgraded:         ${report.resourcesUpgraded}`);
    console.log(`Duplicates Handled:         ${report.duplicatesDetected}`);
    console.log('=========================================\n');

  } catch (err) {
    console.error('Fatal error during sweep:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from DB.');
  }
}

// Allow running directly
if (require.main === module) {
  runSweep();
}

module.exports = { runSweep };
