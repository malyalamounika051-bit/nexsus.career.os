# AI Module: LLM Prompts & Failover Gates

## Purpose
Examines prompt strategies, JSON parser recovery methods, and LLM orchestration routing.

## Model Failover Routing
The system routes requests using `geminiClient.js` with failover fallbacks:
```mermaid
graph TD
    A[Request Start] --> B[NVIDIA NIM: meta/llama-3.1-70b-instruct]
    B -- Success --> C[Return Response]
    B -- Timeout/Rate Limit --> D[OpenRouter Model Chain]
    D --> D1[meta-llama/llama-3.3-70b-instruct]
    D1 -- Fail --> D2[meta-llama/llama-3.1-70b-instruct]
    D2 -- Fail --> D3[qwen/qwen3-coder:free]
```

## JSON Sanitization Gate
Because LLM outputs can include markdown formatting or leading/trailing commas, the system uses a custom parser (`jsonParser.js`):
1. **Markdown Stripper**: Regex searches for ` ```json ... ``` ` blocks.
2. **Object Extractor**: Finds first occurrence of `{` and walks brackets to capture the inner structure.
3. **Syntax Cleaner**: Normalizes smart quotes and removes trailing commas before invoking JSON parse.
4. **Validation Filter**: Controller filters properties against profile data to prevent hallucinated achievements or unverified skills.
