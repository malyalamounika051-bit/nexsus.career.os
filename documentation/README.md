# Nexus Career OS 🚀

> Unified Career Co-pilot and ATS Resume Automator.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![Platform](https://img.shields.io/badge/platform-React%20%7C%20Node.js-blue.svg)]()
[![Database](https://img.shields.io/badge/database-MongoDB-green.svg)]()
[![AI Engine](https://img.shields.io/badge/AI-Gemini%20%7C%20Llama%203.3-purple.svg)]()

Nexus Career OS is a unified co-pilot platform that consolidates user profile management, resume compilation, and skill assessment. Unlike fragmented tools, Nexus uses a single, database-backed profile as the source of truth to automate resume generation, mock interviews, and skill gap audits.

---

## 🌟 Key Features
- **Smart Profile Core**: One-time profile builder tracking skills, experience, and projects.
- **ATS Resume Builder**: One-click tailored resumes generated using only verified profile data.
- **Skill Gap Analyzer**: Side-by-side keyword matching comparing current skills against target roles.
- **Failover AI Gateway**: OpenRouter failover routing chain linking Llama 3.1 and Gemini 3.5.

---

## 🏗 System Architecture
```mermaid
graph TD
    Client[Web Client: React] <--> API[API Gateway / Express.js]
    API <--> MongoDB[(MDB Atlas Database)]
    API <--> AI[OpenRouter / Gemini AI Co-pilot]
    API <--> Auth[Firebase Identity Authentication]
```

---

## ⚙ Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/malyalamounika051-bit/nexsus.career.os.git
   cd nexsus.career.os
   ```

2. **Backend Setup**:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

3. **Frontend Setup**:
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
