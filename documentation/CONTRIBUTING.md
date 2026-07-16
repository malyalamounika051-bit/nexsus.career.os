# Contributing to Nexus Career OS

Welcome! We are excited that you want to contribute to the ultimate Career OS. Please review the guidelines below to ensure a smooth development process.

## Code of Conduct
By participating in this project, you agree to abide by our Code of Conduct (see [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)).

## Git Workflow
We use a feature-branch workflow. Follow these steps:
1. **Fork/Clone** the repository.
2. Create a clean branch from `main`:
   ```bash
   git checkout -b feature/your-awesome-feature
   ```
3. Commit your changes with clear, structured messages following [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat: add profile-driven resume generation`
   - `fix: resolve type casting error in database connection`
4. Push your branch and open a Pull Request against `main`.

## Code Style & Formatting
- **Frontend**: Follow Standard React hooks patterns, ES6 syntax, and semantic Tailwind/Vanilla CSS structures.
- **Backend**: Wrap all asynchronous endpoints in robust `try/catch` layers. Keep Mongoose schemas structured and document all API routes using OpenAPI formatting.
