<div align="center">

# ⚡ Nexus Career OS

### The AI-Powered Career Operating System for Modern Job Seekers

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

---

**Stop copy-pasting. Start career-building.**

Nexus Career OS is an all-in-one platform that helps students and job seekers discover their career path, build ATS-optimized resumes, practice mock interviews, track skill gaps, and find job opportunities — all from one unified dashboard.

[🚀 Live Demo](https://nexus-career-os.vercel.app) · [📖 Documentation](documentation/) · [🐛 Report Bug](https://github.com/malyalamounika051-bit/nexsus.career.os/issues) · [✨ Request Feature](https://github.com/malyalamounika051-bit/nexsus.career.os/issues)

</div>

---

<!-- Banner / Screenshot Placeholder -->
<div align="center">

> 🖼️ **Screenshots are available in the [Screenshots](#-screenshots) section below.**

</div>

---

## 📋 Table of Contents

- [Introduction](#-introduction)
- [Problem Statement](#-problem-statement)
- [Our Solution](#-our-solution)
- [Key Features](#-key-features)
- [Project Workflow](#-project-workflow)
- [Tech Stack](#-tech-stack)
- [Folder Structure](#-folder-structure)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Screenshots](#-screenshots)
- [API Overview](#-api-overview)
- [Future Improvements](#-future-improvements)
- [Contributors](#-contributors)
- [License](#-license)
- [Contact](#-contact)

---

## 🌟 Introduction

**Nexus Career OS** is a comprehensive career management platform built for students, fresh graduates, and anyone navigating the job market.

Think of it as your personal career operating system — a single place where you:

- Discover what career path suits you best
- Build tailored resumes that pass ATS filters
- Practice interviews with an AI interviewer
- Track which skills you need to learn
- Find real job opportunities and internships
- Get guidance from an AI career mentor

### Why We Built This

The job search process is fragmented. Candidates juggle between resume builders, job boards, skill assessment platforms, and career guides — none of which talk to each other.

We built Nexus to bring everything together. Fill your profile once, and every tool on the platform uses that information automatically. No more copy-pasting the same details into 10 different websites.

### Who Is This For?

- 🎓 **College Students** preparing for placements
- 💼 **Fresh Graduates** entering the job market
- 🔄 **Career Switchers** moving into tech
- 📚 **Self-taught Developers** building their credentials
- 🏫 **Bootcamp Graduates** looking for their first roles

---

## 🔍 Problem Statement

Getting a tech job today is harder than it should be. Here's what candidates deal with:

| Problem | Impact |
|---------|--------|
| **Repetitive Data Entry** | Candidates spend hours rewriting the same information for each application |
| **ATS Black Hole** | Up to 75% of qualified resumes get filtered out by automated systems due to missing keywords |
| **Skill Blindness** | Candidates don't know which specific skills they're missing for their target roles |
| **No Feedback Loop** | Rejections come without explanation, leaving candidates guessing what went wrong |
| **Fragmented Tools** | Resume builders, job boards, skill trackers, and interview prep tools don't connect to each other |
| **Generic Career Advice** | Most guidance is one-size-fits-all and doesn't account for individual profiles |

The result? Students spend weeks on manual preparation that could be automated, and still end up applying with unoptimized resumes.

---

## 💡 Our Solution

Nexus Career OS solves these problems with three core principles:

### 1. Single Source of Truth
Your profile is filled once and used everywhere. Education, skills, projects, experience — entered once, synced across all tools automatically.

### 2. AI That Stays Honest
Our AI tailors your resume content and provides career advice, but it **never fabricates skills or experience**. Every skill on your resume is verified against your actual profile data.

### 3. Everything Connected
Career assessment results feed into your roadmap. Your roadmap identifies skill gaps. Your skills power your resume. Your resume prepares you for interviews. Everything works together.

---

## ✨ Key Features

### 🤖 Sara — AI Career Mentor
Your personal AI career advisor that's always available.

- **What it does**: Answer career questions, get resume tips, discuss industry trends, brainstorm project ideas, or simply ask for motivation.
- **How it works**: Powered by large language models (Llama 3.1 / Gemini) through OpenRouter with automatic failover routing. Sara remembers your conversation context within a session.
- **Benefit**: Like having a senior mentor available 24/7 — without the scheduling hassle.

---

### 🧬 Career DNA Analysis
Discover your professional identity through a structured self-assessment.

- **What it does**: Takes you through an 8-step questionnaire covering your interests, work style, strengths, and preferences. Generates a unique "Career DNA" profile with your top career archetypes.
- **How it works**: AI analyzes your responses to map you to professional archetypes (e.g., "The Builder," "The Strategist") and recommends matching career paths.
- **Benefit**: Helps you understand your natural strengths and which career directions align with who you are.

---

### 🧭 AI Career GPS
Get a personalized career navigation plan based on your DNA results.

- **What it does**: Generates a detailed career roadmap tailored to your assessment results. Shows recommended roles, required skills, learning milestones, and a timeline.
- **How it works**: Uses your Career DNA profile and current skill set to plot a realistic path from where you are to where you want to be.
- **Benefit**: No more guessing what to learn next. You get a clear, step-by-step career plan.

---

### 👤 Smart Profile
The central hub for all your professional information.

- **What it does**: Store your personal details, education history, skills (with proficiency levels), projects, work experience, certifications, achievements, languages, and social links — all in one place.
- **How it works**: Data is saved to MongoDB and automatically feeds into the Resume Builder, Skill Gap Analyzer, and other tools. Supports resume upload with AI-powered parsing to auto-fill fields.
- **Benefit**: Fill your profile once. Every other feature on the platform uses it automatically.

---

### 📄 AI Resume Builder
Generate ATS-optimized resumes tailored to specific job descriptions.

- **What it does**: Takes a target job role or full job description and generates a complete, tailored resume using your verified profile data. Includes professional summary, experience bullet points (rewritten using the STAR method), and skills — all matched to the job requirements.
- **How it works**: Fetches your profile from the database, sends it along with the job description to the AI model, and sanitizes the output to ensure only your real skills appear. Comes with 7 premium templates (Sahara Contrast, Royal Essence, Glacier Chill, and more). Export as PDF or DOCX.
- **Benefit**: One-click tailored resumes. No copy-pasting. No fake skills. Professional templates ready for submission.

---

### 📊 Skill Gap Analysis
See exactly what skills you need for your target role.

- **What it does**: Compares your current skills against the requirements of a target job. Shows matching skills, missing skills, and recommendations for each gap — including estimated learning time, difficulty, career impact, and potential salary boost.
- **How it works**: Runs alongside resume generation. The AI analyzes job requirements and cross-references them with your verified profile skills. Results are filtered to prevent overlap between matching and missing categories.
- **Benefit**: Know exactly what to learn, how long it will take, and how much it could impact your career.

---

### 📈 Skill Trends
Stay updated on which skills are in demand.

- **What it does**: Shows trending technologies and skills across different domains. Displays demand levels, growth trajectories, and salary ranges for each skill.
- **How it works**: Aggregates industry data and displays it through interactive charts and visual indicators.
- **Benefit**: Make informed decisions about which skills to invest your time in.

---

### 🗺️ AI Roadmaps
Get structured learning paths for any career goal.

- **What it does**: Generates detailed, phase-by-phase learning roadmaps for specific career roles (Frontend Developer, Data Scientist, DevOps Engineer, etc.). Each phase includes topics, recommended resources, projects to build, and time estimates.
- **How it works**: AI generates comprehensive roadmaps based on current industry requirements. Pre-cached roadmaps are available for popular roles, with custom generation for specific requests.
- **Benefit**: Follow a structured learning path instead of randomly watching tutorials.

---

### 🎯 Opportunity Radar
Discover scholarships, hackathons, internships, and programs.

- **What it does**: Aggregates opportunities from multiple sources and displays them in a searchable, filterable dashboard. Includes scholarships, hackathons, competitions, bootcamps, and fellowship programs.
- **How it works**: Scrapes and caches opportunity data from curated sources. Users can filter by type, save favorites, and track application deadlines.
- **Benefit**: Find opportunities you didn't know existed — all in one searchable place.

---

### 💼 Job Search
Search and discover relevant tech job listings.

- **What it does**: Aggregates job postings from multiple sources. Users can search by keyword, filter by location and experience level, save interesting jobs, and track application status.
- **How it works**: Fetches and caches job data from external APIs. Displays results with company details, requirements, salary ranges, and direct application links.
- **Benefit**: A clean, focused job search experience without the noise of generic job boards.

---

### 🎙️ AI Mock Interview
Practice job interviews with an AI interviewer.

- **What it does**: Simulates a real technical or behavioral interview. Select your target role and difficulty level, and the AI asks relevant questions one by one. After the session, receive a detailed report with scores, feedback, and improvement suggestions.
- **How it works**: AI generates role-specific interview questions. Your responses are evaluated for technical accuracy, communication clarity, and completeness. Supports webcam integration for a realistic experience.
- **Benefit**: Practice interviews without the pressure. Get honest feedback before the real thing.

---

### 📰 Career Pulse (News Dashboard)
Stay informed with curated tech industry news.

- **What it does**: Displays curated news articles from RSS feeds covering AI, Big Tech, startups, cloud computing, cybersecurity, data science, and career tips.
- **How it works**: Backend fetches and caches RSS feed articles from trusted tech publications. Articles are categorized and searchable from the Command Center dashboard.
- **Benefit**: Stay current with industry trends without leaving the platform.

---

### 🎮 Career Simulator
Explore different career scenarios interactively.

- **What it does**: Lets you simulate career decisions and see potential outcomes. Explore "what if" scenarios for different roles, industries, and skill combinations.
- **How it works**: AI generates realistic career scenarios based on your profile and the paths you choose to explore.
- **Benefit**: Make better career decisions by understanding potential outcomes before committing.

---

### 🏆 Gamification & Progress Tracking
Stay motivated with XP, levels, streaks, and badges.

- **What it does**: Tracks your platform activity and rewards engagement. Earn XP for completing assessments, building resumes, practicing interviews, and using features. Level up, maintain login streaks, and unlock badges.
- **How it works**: Backend automatically calculates and updates XP, levels, and streaks on each login and activity. Badge criteria are checked after key actions.
- **Benefit**: Makes career preparation feel less like a chore and more like a game.

---

### 📊 Command Center (Dashboard)
Your career mission control.

- **What it does**: Provides an at-a-glance overview of your career journey. Shows profile completion, streak status, XP and level, latest Career GPS recommendations, trending skills, recent opportunities, job listings, Career Pulse news, and a daily motivational quote.
- **How it works**: Aggregates data from all platform modules into a single, clean dashboard view.
- **Benefit**: See everything that matters in one place. Know exactly where to focus next.

---

## 🔄 Project Workflow

Here's the complete user journey through Nexus Career OS:

```
  ┌──────────────────────────────────────────────────────────────────┐
  │                                                                  │
  │   📝 Register / Sign In                                         │
  │       ↓                                                          │
  │   👤 Complete Your Profile (Single Source of Truth)              │
  │       ↓                                                          │
  │   🧬 Take Career DNA Assessment                                 │
  │       ↓                                                          │
  │   🧭 Get Your Career GPS (Personalized Navigation Plan)         │
  │       ↓                                                          │
  │   🗺️ Follow AI Roadmaps (Structured Learning Paths)             │
  │       ↓                                                          │
  │   📈 Track Skill Gaps & Learn Missing Skills                    │
  │       ↓                                                          │
  │   📄 Build ATS-Optimized Resume (AI Resume Builder)             │
  │       ↓                                                          │
  │   🎙️ Practice Mock Interviews (AI Interviewer)                   │
  │       ↓                                                          │
  │   💼 Search Jobs & Opportunities (Job Hub + Radar)              │
  │       ↓                                                          │
  │   🎯 Apply with Confidence!                                     │
  │                                                                  │
  └──────────────────────────────────────────────────────────────────┘
```

Each step feeds into the next. Your profile powers your resume. Your skill gaps inform your roadmap. Your interview practice builds confidence for real applications.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19, Vite | Modern component-based UI with fast HMR |
| **Styling** | Vanilla CSS + CSS Variables | Custom design system with dark/light theme support |
| **Animations** | Framer Motion | Smooth transitions and micro-interactions |
| **Charts** | Recharts | Data visualization for skills, trends, and scores |
| **Icons** | Lucide React | Clean, consistent icon set |
| **Backend** | Node.js, Express 5 | RESTful API server |
| **Database** | MongoDB Atlas, Mongoose | Cloud-hosted document database with schema validation |
| **Authentication** | Firebase Auth + JWT | Google OAuth sign-in and email/password with OTP verification |
| **AI Models** | Llama 3.1 70B, Gemini 3.5 | Career advice, resume generation, interview questions |
| **AI Gateway** | OpenRouter + NVIDIA NIM | Multi-model routing with automatic failover |
| **Resume Export** | html2pdf.js, docx, jspdf | PDF and Word document generation |
| **Resume Parsing** | pdf-parse, mammoth | Extract content from uploaded PDF/DOCX resumes |
| **Email** | Nodemailer (Gmail SMTP) | OTP verification and welcome emails |
| **News Feeds** | rss-parser | Tech industry news aggregation |
| **Web Scraping** | Cheerio, Axios | Opportunity data collection |
| **Deployment** | Vercel (Frontend + Backend) | Serverless deployment with edge CDN |
| **Version Control** | Git + GitHub | Source code management |

---

## 📁 Folder Structure

```
nexsus.MakersConclave/
│
├── frontend/                    # React client application
│   ├── public/                  # Static assets
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── Sidebar.jsx          # Navigation sidebar
│   │   │   ├── ResumeTemplates.jsx  # 7 premium resume templates
│   │   │   ├── SaraFloatingChat.jsx # AI mentor chat widget
│   │   │   ├── ProgressRing.jsx     # Circular progress indicator
│   │   │   └── ...
│   │   ├── context/             # React context providers
│   │   │   └── AuthContext.jsx      # Authentication state management
│   │   ├── pages/               # Route-level page components
│   │   │   ├── Dashboard.jsx        # Command Center
│   │   │   ├── CareerDNA.jsx        # Career DNA assessment
│   │   │   ├── Profile.jsx          # Smart Profile editor
│   │   │   ├── ResumeBuilder.jsx    # AI Resume Builder
│   │   │   ├── SkillGap.jsx         # Skill Gap Analysis
│   │   │   ├── SkillTrends.jsx      # Skill Trends dashboard
│   │   │   ├── Roadmap.jsx          # AI Career Roadmaps
│   │   │   ├── Jobs.jsx             # Job Search
│   │   │   ├── OpportunityRadar.jsx # Opportunity Radar
│   │   │   ├── MockInterviewSetup.jsx # Interview configuration
│   │   │   ├── InterviewRoom.jsx    # Live interview session
│   │   │   ├── InterviewReport.jsx  # Post-interview analysis
│   │   │   ├── MentorChat.jsx       # Sara AI full-page chat
│   │   │   ├── CareerSimulator.jsx  # Career simulation
│   │   │   └── ...
│   │   ├── services/            # API service modules
│   │   ├── firebase.js          # Firebase configuration
│   │   ├── App.jsx              # Root component with routing
│   │   └── index.css            # Global stylesheet
│   ├── package.json
│   └── vite.config.js
│
├── backend/                     # Express API server
│   ├── config/
│   │   └── db.js                    # MongoDB connection with pooling
│   ├── controllers/             # Route handlers
│   │   ├── authController.js        # Login, register, OTP, OAuth
│   │   ├── resumeController.js      # Resume generation & analysis
│   │   ├── careerController.js      # Career DNA & GPS
│   │   ├── interviewController.js   # Mock interview sessions
│   │   ├── mentorController.js      # Sara AI conversations
│   │   ├── skillGapController.js    # Skill gap analysis
│   │   └── ...
│   ├── middleware/              # Express middleware
│   │   ├── authMiddleware.js        # JWT + Firebase token verification
│   │   └── accountLockout.js        # Brute-force protection
│   ├── models/                  # Mongoose schemas
│   │   ├── User.js                  # User account
│   │   ├── UserProfile.js           # Master profile (Single Source of Truth)
│   │   ├── Resume.js                # Generated resumes
│   │   ├── UserCareerState.js       # Career DNA & GPS data
│   │   ├── Interview.js             # Interview sessions & reports
│   │   └── ...
│   ├── routes/                  # API route definitions
│   ├── services/                # Business logic & external integrations
│   ├── utils/                   # Helper functions (AI client, email, etc.)
│   ├── server.js                # Application entry point
│   ├── package.json
│   └── vercel.json              # Vercel deployment config
│
├── documentation/               # Project documentation repository
│   ├── docs/                        # 27 detailed specification documents
│   ├── presentation/                # Pitch decks and demo scripts
│   └── references/                  # Research and competitor analysis
│
└── vercel.json                  # Root deployment config
```

---

## 🚀 Installation

Follow these steps to run Nexus Career OS on your local machine.

### Prerequisites

Make sure you have these installed:
- **Node.js** (v18 or higher) — [Download here](https://nodejs.org)
- **Git** — [Download here](https://git-scm.com)
- **MongoDB Atlas** account (free tier works) — [Sign up here](https://www.mongodb.com/atlas)
- **Firebase** project (for Google authentication) — [Firebase Console](https://console.firebase.google.com)

### Step 1: Clone the Repository

```bash
git clone https://github.com/malyalamounika051-bit/nexsus.career.os.git
cd nexsus.career.os
```

### Step 2: Set Up the Backend

```bash
# Navigate to the backend directory
cd backend

# Install all backend dependencies
npm install

# Create your environment file
cp .env.example .env

# Open the .env file and fill in your credentials (see Environment Variables section below)

# Start the backend development server
npm run dev
```

The backend server will start on `http://localhost:5000`.

### Step 3: Set Up the Frontend

Open a **new terminal window**:

```bash
# Navigate to the frontend directory
cd frontend

# Install all frontend dependencies
npm install

# Start the frontend development server
npm run dev
```

The frontend will start on `http://localhost:5173`.

### Step 4: Open in Browser

Visit `http://localhost:5173` in your browser. You're ready to go! 🎉

> **Quick Tip**: Click **"Try Demo Account"** on the login page to explore the platform instantly without creating an account.

---

## 🔐 Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```env
# Server
PORT=5000
NODE_ENV=development

# Database — Your MongoDB Atlas connection string
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/nexus_career_os

# Authentication
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRE=7d

# Demo Account (auto-created on first run)
DEMO_EMAIL=demo@nexus.com
DEMO_PASSWORD=demo1234

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# LinkedIn OAuth (optional)
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_CALLBACK_URL=http://localhost:5000/api/auth/linkedin/callback

# Frontend URL
FRONTEND_URL=http://localhost:5173

# AI — OpenRouter API Key (https://openrouter.ai)
OPENROUTER_API_KEY=sk-or-v1-your_openrouter_api_key

# Email — Gmail SMTP (for OTP verification)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_16_character_app_password
FROM_NAME=Nexus Career OS
FROM_EMAIL=your_email@gmail.com
```

> ⚠️ **Important**: Never commit your `.env` file to GitHub. It's already included in `.gitignore`.

---

## 📸 Screenshots

> Screenshots of the live application:

| Feature | Description |
|---------|-------------|
| **Command Center** | Dashboard with career stats, news, trending skills, and opportunities |
| **Career DNA** | Interactive assessment generating your professional archetype |
| **Smart Profile** | Complete profile editor with skills, education, projects, and experience |
| **AI Resume Builder** | One-click resume generation with skill gap analysis and template switching |
| **Skill Trends** | Interactive charts showing technology demand and salary data |
| **AI Roadmaps** | Phase-by-phase learning paths for target career roles |
| **Opportunity Radar** | Searchable database of scholarships, hackathons, and programs |
| **Job Search** | Aggregated job listings with filters and save functionality |
| **Mock Interview** | AI-powered interview simulator with detailed feedback reports |
| **Sara AI Mentor** | Conversational AI career advisor |

---

## 🔌 API Overview

The backend exposes RESTful APIs organized by feature module. All protected routes require a valid JWT or Firebase ID token in the `Authorization: Bearer <token>` header.

| Module | Base Route | Key Endpoints |
|--------|-----------|---------------|
| **Auth** | `/api/auth` | Register, Login, OTP Verify, Google OAuth, Demo Login, Get Current User |
| **Profile** | `/api/profile` | Get/Save/Update master profile, Upload & parse resume |
| **Resume** | `/api/resumes` | Create, list, delete resumes; AI generate-from-profile |
| **Career** | `/api/career` | Career DNA assessment, GPS generation, career state |
| **Interview** | `/api/interview` | Start session, submit answers, generate report |
| **Mentor** | `/api/mentor` | Chat with Sara AI, conversation history |
| **Skill Gap** | `/api/skill-gap` | Analyze skill gaps for target roles |
| **Skill Intel** | `/api/skill-intelligence` | Trending skills, demand data, comparisons |
| **Jobs** | `/api/jobs` | Search jobs, save/unsave, application tracking |
| **Opportunities** | `/api/opportunities` | List, filter, save scholarships/hackathons/programs |
| **Roadmaps** | `/api/career/roadmaps` | Generate and retrieve learning roadmaps |
| **Dashboard** | `/api/dashboard` | Aggregated stats, suggestions, daily quotes |
| **Assessment** | `/api/assessments` | Store and retrieve career assessments |

> 📖 For detailed endpoint documentation with request/response examples, see [docs/12_API_Documentation.md](documentation/docs/12_API_Documentation.md).

---

## 🔮 Future Improvements

We're continuously building. Here's what's on the roadmap:

| Feature | Description | Status |
|---------|-------------|--------|
| 🎤 **Voice AI Interviews** | Real-time voice-based mock interviews with speech analysis | Planned |
| 🤖 **AI Agents** | Autonomous agents that can apply to jobs, track deadlines, and send reminders | Planned |
| 📱 **Mobile App** | Native Android/iOS app using React Native | Planned |
| 👥 **Team Collaboration** | Study groups, peer reviews, and shared roadmaps | Planned |
| 📊 **Advanced Analytics** | Detailed career analytics with market salary comparisons | Planned |
| 🏢 **Company Dashboard** | Recruiter-facing portal to discover and evaluate candidates | Planned |
| 🔗 **GitHub Integration** | Auto-sync project contributions from GitHub repositories | Planned |
| 🌐 **Multi-language Support** | Platform localization for Hindi, Telugu, and other regional languages | Planned |

---

## 👥 Contributors

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/malyalamounika051-bit">
        <b>Mounika Malyala</b>
      </a>
      <br />
      <sub>Full Stack Developer & Project Lead</sub>
    </td>
  </tr>
</table>

> Want to contribute? Check out our [Contributing Guidelines](documentation/CONTRIBUTING.md) and [Code of Conduct](documentation/CODE_OF_CONDUCT.md).

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](documentation/LICENSE) file for details.

You're free to use, modify, and distribute this project. Attribution is appreciated but not required.

---

## 📬 Contact

Have questions, feedback, or want to collaborate? Reach out!

| Channel | Link |
|---------|------|
| 🐙 **GitHub** | [@malyalamounika051-bit](https://github.com/malyalamounika051-bit) |
| 💼 **LinkedIn** | [Malyala Mounika](https://www.linkedin.com/in/malyala-mounika-100736372/) |
| 📧 **Email** | malyalamounika0@gmail.com |

---

<div align="center">

**Built with ❤️ for the Makers Conclave Hackathon**

⭐ If you found this project useful, consider giving it a star on GitHub!

</div>
