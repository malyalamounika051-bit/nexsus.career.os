# Frequently Asked Questions (FAQ)

## General Queries

### How does Nexus Career OS prevent AI hallucinations on resumes?
We use programmatic filter pipelines. The AI parses the job requirements, but the final backend generator filters all suggested resume skills against the user's verified profile skills. This ensures that only true, verified credentials appear on the resume.

### What resume export formats are supported?
We support instant web print preview PDF downloads using a client-side vector renderer (`html2pdf.js`), as well as editable Microsoft Word (`.docx`) file exports.

---

## Technical Queries

### How are MongoDB connection pool limits managed in serverless server environments?
To prevent connection exhaustion under concurrent requests, we cache the database connection promise in our connection utility (`db.js`). This allows warm serverless functions to reuse established connections.
