# Backend Architecture: Express & Database Pooling

## Purpose
Details the design of the Express.js REST API gateway, database pooling, and middleware integrations.

## Router Layout & Controller Actions
- **Authentication**: `authMiddleware.js` parses Firebase headers or standard JWT tokens, populating `req.user`.
- **Database Connection Manager**: `db.js` implements serverless-friendly promise-level caching (preventing multiple Mongoose connection instantiations on concurrent Vercel requests).
- **Service Interfaces**: Endpoints leverage helper methods to call LLMs and validate structured outputs.

```mermaid
sequenceDiagram
    participant FE as Frontend Client
    participant BE as Express Router
    participant MID as Auth Middleware
    participant CTRL as Resume Controller
    participant MDB as MongoDB Atlas
    
    FE->>BE: POST /resumes/ai/generate-from-profile
    BE->>MID: Parse Headers
    MID->>BE: Authorized req.user
    BE->>CTRL: generateProfileResume(req, res)
    CTRL->>MDB: Find UserProfile by req.user._id
    MDB-->>CTRL: Return Profile JSON
    CTRL->>CTRL: Clean, tailor, & filter
    CTRL-->>FE: Return generated resume JSON
```
