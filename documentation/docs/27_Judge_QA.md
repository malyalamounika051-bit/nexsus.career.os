# Hackathon Judge QA Prep Guide

## Purpose
Strategic guide containing potential questions from judges, detailed technical answers, and talking points.

---

### Q1: "How do you protect candidate data privacy when sending profiles to third-party LLMs?"
- **Strategic Answer**: We sanitize all profile payloads before transmitting them to LLM gateways. Personally identifiable information (PII) like emails, phone numbers, and physical addresses are scrubbed or masked in the prompt context. Only technical skills, education details, and project text metrics are passed to the AI to tailors resumes.

---

### Q2: "Why use MongoDB instead of a Relational Database like PostgreSQL?"
- **Strategic Answer**: Tech resumes and candidate profiles are highly semi-structured documents; profiles vary widely in projects, achievements, and custom sections. MongoDB's document-model allows us to model these varying sub-documents cleanly in a single collection without the overhead of complex, multi-table joins.

---

### Q3: "What is your fallback strategy if Gemini or OpenRouter APIs go offline?"
- **Strategic Answer**: We built an automated API failover routing chain. If OpenRouter times out or returns a rate limit (429/402) code, the middleware automatically diverts the payload to secondary models (like Qwen coder models) or direct NVIDIA NIM endpoints to ensure uninterrupted service.
