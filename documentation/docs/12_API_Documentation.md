# API Documentation: Gateway Endpoints

## Purpose
Reference guide for frontend integration, outlining request payloads, headers, and HTTP responses.

---

## 1. Profile Endpoints

### `GET /api/profile`
- **Purpose**: Fetch current user profile. Seeds default values if empty.
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "fullName": "Mounika Malyala",
      "email": "malyalamounika0@gmail.com",
      "skills": [{"name": "JavaScript", "proficiency": "Intermediate"}],
      "projects": []
    }
  }
  ```

---

## 2. Resume Endpoints

### `POST /api/resumes/ai/generate-from-profile`
- **Purpose**: Generates tailored resume, gap report, and metrics using profile.
- **Payload**:
  ```json
  {
    "jobRole": "Frontend Developer",
    "jobDescription": "Looking for React developer..."
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "resumeId": "64b1234567890",
      "resume": {
        "personalInfo": { "name": "Mounika Malyala", "title": "Frontend Developer" },
        "skills": ["JavaScript", "Python"],
        "experiences": []
      },
      "skillGap": {
        "matchingSkills": [{"name": "JavaScript", "relevance": "High"}],
        "missingSkills": [{"name": "TypeScript", "importance": "Critical"}]
      },
      "scores": { "atsScore": 85, "overall": 80 }
    }
  }
  ```
