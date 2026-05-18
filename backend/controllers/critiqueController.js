const { callGeminiSDK } = require('../utils/geminiClient');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const SYSTEM_INSTRUCTION = `You are Sara, the Expert Career Mentor at Nexus Career OS. 
Your task is to provide a rigorous, professional, and actionable critique of the user's resume or portfolio.

Structure your response using the following headers:
1. 🌟 **Executive Summary**: A brief 2-3 sentence overview of the document's overall impact.
2. ✅ **What's Working Well**: Highlight 2-3 strong points.
3. 🛠️ **Areas for Improvement**: Identify specific weaknesses or missing elements.
4. 🚀 **Actionable Steps**: Provide a numbered list of immediate changes to make.
5. 💡 **Skill Gap Analysis**: Suggest 2-3 skills that would strengthen this profile for their target roles.

Be direct but encouraging. Focus on quantifiable achievements, clarity of language, and professional layout.
If the input is just text, analyze the content. If it's a file, analyze the extracted text.`;

const analyzePortfolio = async (req, res) => {
  try {
    let content = req.body.text;
    
    // If a file was uploaded, extract text from it
    if (req.file) {
      if (req.file.mimetype === 'application/pdf') {
        const pdfData = await pdfParse(req.file.buffer);
        content = pdfData.text;
      } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const data = await mammoth.extractRawText({ buffer: req.file.buffer });
        content = data.value;
      }
    }

    if (!content || content.trim().length < 50) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide more detailed content or a valid PDF/Docx file for analysis.' 
      });
    }

    const response = await callGeminiSDK({
      model: 'gemini-2.5-flash',
      contents: `Here is the resume/portfolio content to critique:\n\n${content}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      }
    }, { preferredModel: 'gemini-2.5-flash' });

    const critique = response.text;

    res.status(200).json({
      success: true,
      data: {
        critique: critique
      }
    });
  } catch (error) {
    console.error('Critique Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to analyze the document. Please try again.' 
    });
  }
};

module.exports = {
  analyzePortfolio
};
