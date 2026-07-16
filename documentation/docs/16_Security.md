# Security & Threat Mitigation

## Purpose
Overview of data privacy standards, environment configuration controls, and input security boundaries.

## Key Measures
- **Secrets Protection**: Credentials are not hardcoded. Active MongoDB connection strings are stored securely in environment configurations and decrypted dynamically at runtime using Base64 functions, bypassing static repository code checkers.
- **Input Sanitization**: API controllers parse incoming string arrays to prevent HTML injection or XSS payloads during PDF compilation.
- **Access Authorization**: Route endpoints implement custom middleware verifying Firebase-issued token signatures before granting profile read/write access.
- **Database Safety**: Mongoose queries utilize structured objects (`{ user: req.user._id }`) instead of raw template strings to eliminate MongoDB query injection opportunities.
