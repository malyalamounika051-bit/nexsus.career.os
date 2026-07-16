# Feature Specifications: Core Capabilities

## Purpose
Detailed product specifications for engineers and QA teams detailing system inputs, outputs, and behaviors.

---

## Feature 1: Master Profile System
- **Input**: User-provided forms (personal information, college degree, projects, verified github links, work history).
- **Behavior**: Auto-saves on changes. Re-calculates completion metrics.
- **Output**: JSON document synced to MongoDB UserProfile collection.

---

## Feature 2: Profile-Driven AI Resume Builder
- **Input**: Target Job Description or Job Role string.
- **Behavior**:
  - Fetches the active Profile from MongoDB.
  - Formulates a context prompt for Gemini.
  - Rewrites project experience and summaries to match the target JD.
  - Sanitizes returned lists to prevent hallucinated skill sets.
- **Output**: Formatted ATS resume (React render component) with DOCX and PDF export configurations.

---

## Feature 3: Skill Gap Analysis
- **Input**: User skills array vs job requirements keywords.
- **Behavior**: Real-time diff matching. Filters matching vs missing skills.
- **Output**: Interactive metrics panel displaying difficulty rating, learning time, and estimated salary impact.
