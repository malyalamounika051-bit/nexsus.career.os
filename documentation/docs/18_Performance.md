# Performance Tuning: Caching & Optimization

## Purpose
Specifies response time guidelines, caching mechanisms, and connection pooling settings.

## Optimization Strategy
- **Mongoose Connection Pooling**: Serverless functions cache connection instances locally, preventing overhead from opening new database connections on every API call.
- **AI Response Caching**: Profile analysis caching ensures dashboard metrics persist for one hour before recalculating via LLM.
- **Client Bundle Footprint**: Vite is configured for code-splitting (separating UI components from PDF/DOCX compiler libraries), keeping initial load bundles below 300KB.
- **News Feed Cutoff**: RSS feed services query a 60-day historical window with local index caches, ensuring page loads resolve in under 150ms.
