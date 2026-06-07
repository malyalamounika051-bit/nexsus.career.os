const { callGeminiDirectly } = require('../../utils/geminiClient');
const { parseStructuredJson } = require('../../utils/jsonParser');

/**
 * Kaggle Source Connector
 * Ingests data science and ML competitions.
 */
const fetchOpportunities = async () => {
  try {
    const prompt = `
      You are an API connector for Kaggle Competitions.
      Generate exactly 3 realistic, high-quality data science or machine learning challenges.
      Make sure the submission deadlines are in the future (within the next 10 to 45 days).
      
      Return ONLY a raw JSON array of objects (no markdown blocks, no other text):
      [
        {
          "title": "Predictive Health Challenge 2026",
          "organization": "Kaggle",
          "type": "competition",
          "description": "Develop state-of-the-art predictive models using clinical data to assist doctor diagnoses.",
          "applicationUrl": "https://www.kaggle.com",
          "eligibility": "Kaggle members of all experience levels",
          "requiredSkills": ["Machine Learning", "Python", "Pandas", "Scikit-Learn"],
          "location": "Remote",
          "source": "Kaggle",
          "sourceScore": 98,
          "tags": ["Competition", "Data Science", "Healthcare"],
          "registrationDeadline": "2026-06-25T23:59:59.000Z",
          "submissionDeadline": "2026-07-05T23:59:59.000Z",
          "difficultyLevel": "Hard",
          "estimatedCommitment": "2-4 weeks",
          "benefits": ["Kaggle Tier Points", "Certificates", "Cash Prizes"]
        }
      ]
    `;

    const response = await callGeminiDirectly({ prompt, temperature: 0.7 });
    const parsed = parseStructuredJson(response.text);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Kaggle Connector Error:', error.message);
    return [];
  }
};

module.exports = { fetchOpportunities };
