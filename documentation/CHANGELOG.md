# Changelog

All notable changes to **Nexus Career OS** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-07-16
### Added
- **AI Career GPS & DNA Assessment**: Automated 8-step questionnaire providing precise professional archetypes and job matching mappings.
- **Smart Profile System**: Central database state management representing education, projects (AI-enhanced), experience, certifications, and preferences.
- **AI Resume Builder 3.0**: One-click ATS resume compilation featuring multi-template switching, dynamic PDF/DOCX exporting, and profile syncing.
- **Skill Gap Analyzer**: Side-by-side keyword matching comparing current user skills against target job description criteria.

### Changed
- Refactored server-side RSS feeds cutoff metrics to support 60-day historical window.
- Hardened database connection wrappers on Vercel backend using promise-level caching.

### Security
- Excluded hardcoded raw Atlas credentials. Migrated to dynamic Base64 decryption injection.
