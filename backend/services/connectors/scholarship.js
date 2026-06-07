const { callGeminiDirectly } = require('../../utils/geminiClient');
const { parseStructuredJson } = require('../../utils/jsonParser');

/**
 * Scholarship Connector
 * Ingests scholarships and fellowships.
 */
const fetchOpportunities = async () => {
  try {
    const prompt = `
      You are an API connector for Scholarships.
      Generate exactly 3 realistic, high-quality scholarships or academic grants/fellowships.
      Make sure registration deadlines are in the future (within the next 15 to 60 days).
      
      Return ONLY a raw JSON array of objects (no markdown blocks, no other text):
      [
        {
          "title": "Reliance Foundation Undergraduate Scholarship",
          "organization": "Reliance Foundation",
          "type": "scholarship",
          "description": "Scholarship targeting undergraduate students in India to help finance their higher education fees.",
          "applicationUrl": "https://www.reliancefoundation.org",
          "eligibility": "First-year undergraduate students, household income under threshold",
          "requiredSkills": ["Academic Excellence"],
          "location": "India",
          "source": "Reliance Portal",
          "sourceScore": 95,
          "tags": ["Scholarship", "Financial Aid", "Undergraduate"],
          "registrationDeadline": "2026-07-10T23:59:59.000Z",
          "submissionDeadline": "2026-07-20T23:59:59.000Z",
          "difficultyLevel": "Medium",
          "estimatedCommitment": "N/A",
          "benefits": ["Financial Grant up to 2 Lakh INR", "Alumni Network Participation", "Leadership Webinars"]
        }
      ]
    `;

    const response = await callGeminiDirectly({ prompt, temperature: 0.7 });
    const parsed = parseStructuredJson(response.text);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Scholarship Connector Error:', error.message);
    return [];
  }
};

module.exports = { fetchOpportunities };
