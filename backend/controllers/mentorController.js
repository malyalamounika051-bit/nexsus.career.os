const { callGeminiREST, isQuotaError } = require('../utils/geminiClient');

const SYSTEM_INSTRUCTION = `You are Sara, an expert Career Mentor and Roadmap Guide. 
Your goal is to provide highly actionable, concise, and professional career advice.
If the user asks for a plan or a roadmap, break it down into clear, numbered steps with specific skills, resources, and milestones.
Always be encouraging but realistic. Keep your responses formatted in clean Markdown.
Do not hallucinate external links unless you are certain they exist.`;

// @desc    Chat with AI Mentor
// @route   POST /api/mentor/chat
// @access  Private
const chatWithMentor = async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    // Check if AI keys are present (either one is fine as client handles fallback)
    if (!process.env.GEMINI_API_KEY && !process.env.NVIDIA_API_KEY) {
      return res.status(500).json({ 
        success: false, 
        message: 'AI service is not configured on the server.' 
      });
    }

    // Build conversation contents
    const contents = [];
    
    // Add history if exists
    if (history && history.length > 0) {
      history.forEach(msg => {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      });
    }

    // Add current user message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    // Call Gemini with automatic model fallback
    const responseData = await callGeminiREST({
      contents,
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
      },
      preferredModel: 'gemini-2.0-flash',
    });

    const mentorResponse = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!mentorResponse) {
      return res.status(500).json({
        success: false,
        message: 'AI returned an empty response. Please try again.',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        response: mentorResponse
      }
    });
  } catch (error) {
    console.error('Mentor Chat Error:', error.response?.data || error.message);
    
    const errorData = error.response?.data?.error;
    const errorMessage = errorData?.message || error.message || 'Unknown error occurred';
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to communicate with AI Mentor: ' + errorMessage 
    });
  }
};

module.exports = {
  chatWithMentor
};
