# Database Design: Collection Schemas & Relationships

## Purpose
Specifies MongoDB collections, structural validation metrics, and active indexing properties.

## ER Diagram
```mermaid
erDiagram
    User ||--o| UserProfile : "owns"
    User ||--o{ Resume : "creates"
    User ||--o| UserCareerState : "maintains"
    UserProfile {
        ObjectId id PK
        String fullName
        String email
        Array skills
        Array projects
        Array experience
    }
    Resume {
        ObjectId id PK
        String user FK
        String resumeTitle
        Array skills
        Array experiences
    }
    UserCareerState {
        ObjectId id PK
        String userId FK
        String currentStage
        Object careerDNA
    }
```

## Schema Definitions & Indexes

### Collection: `UserProfiles`
- **Unique Indexes**: `{ user: 1 }` (Ensures single profile source of truth).
- **Structure**: Tracks verified skills, experiences, and project subdocuments (incorporating AI-enhanced STAR bullets).

### Collection: `Resumes`
- **Sparse Indexes**: `{ shareableToken: 1 }` (For public resume sharing).
- **Structure**: Pre-compiled resumes tailored for target job postings.
