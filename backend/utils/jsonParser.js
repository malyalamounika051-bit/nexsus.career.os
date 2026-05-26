/**
 * Robustly parses AI responses that may contain JSON, fenced markdown JSON blocks, 
 * or JSON embedded with conversational/explaining texts.
 * 
 * @param {string|any} raw The raw response from the AI model
 * @returns {any} The parsed JSON object or array
 */
const parseStructuredJson = (raw) => {
  if (raw == null || String(raw).trim() === '') {
    throw new Error('Empty response from AI model.');
  }
  let text = String(raw).trim();
  const fence = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fence) text = fence[1].trim();

  const tryParse = (candidate) => JSON.parse(candidate);

  // Fast path: pure JSON
  try { 
    return tryParse(text); 
  } catch (err) { 
    /* continue */ 
  }

  // Extract first JSON structure (object or array) from mixed model output
  const extractFirstJsonStructure = (input) => {
    const s = String(input);
    const startObj = s.indexOf('{');
    const startArr = s.indexOf('[');
    
    if (startObj < 0 && startArr < 0) return null;
    
    // Determine which starts first
    let start = -1;
    let openChar = '';
    let closeChar = '';
    
    if (startObj >= 0 && (startArr < 0 || startObj < startArr)) {
      start = startObj;
      openChar = '{';
      closeChar = '}';
    } else {
      start = startArr;
      openChar = '[';
      closeChar = ']';
    }
    
    let depth = 0, inString = false, escaped = false;
    for (let i = start; i < s.length; i++) {
      const ch = s[i];
      if (inString) {
        if (escaped) { 
          escaped = false; 
        } else if (ch === '\\') { 
          escaped = true; 
        } else if (ch === '"') { 
          inString = false; 
        }
        continue;
      }
      if (ch === '"') { 
        inString = true; 
        continue; 
      }
      if (ch === openChar) depth += 1;
      if (ch === closeChar) depth -= 1;
      if (depth === 0) return s.slice(start, i + 1);
    }
    return null;
  };

  const extracted = extractFirstJsonStructure(text);
  if (extracted) {
    try {
      return tryParse(extracted);
    } catch (err) {
      // Clean trailing commas if parse fails due to common LLM syntax error
      try {
        const cleaned = extracted
          .replace(/,(\s*[\]}])/g, '$1') // remove trailing commas
          .replace(/[\u201C\u201D]/g, '"'); // normalize smart quotes
        return tryParse(cleaned);
      } catch (nestedErr) {
        throw new Error(`Failed parsing extracted JSON segment: ${err.message}`);
      }
    }
  }

  throw new Error('Model did not return a valid JSON object or array.');
};

module.exports = {
  parseStructuredJson
};
