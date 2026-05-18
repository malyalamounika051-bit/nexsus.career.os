process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');

// Force Google DNS — system resolver blocks SRV queries (ECONNREFUSED on Windows)
dns.setServers(['8.8.8.8', '8.8.4.4']);
const Career = require('./models/Career');
const Advice = require('./models/Advice');
const User = require('./models/User');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected for seeding...');
};

const careers = [
  {
    domain: 'Full Stack Developer',
    description: 'Build end-to-end web applications using modern frameworks and cloud platforms.',
    skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'PostgreSQL', 'Docker', 'AWS'],
    demandScore: 95,
    avgSalary: '₹8-25 LPA',
    growthRate: '25%',
    demand: 'High',
    trendingSkills: ['Next.js', 'TypeScript', 'GraphQL', 'Kubernetes'],
    weights: { technical: 5, creative: 2, analytical: 3, leadership: 1, communication: 1 },
    roadmap: [
      {
        phase: 'Phase 1: Foundations',
        duration: '2-3 months',
        topics: ['HTML/CSS', 'JavaScript ES6+', 'Git & GitHub', 'Command Line'],
        resources: [
          { title: 'The Odin Project', url: 'https://www.theodinproject.com', type: 'course' },
          { title: 'freeCodeCamp', url: 'https://www.freecodecamp.org', type: 'course' },
        ],
      },
      {
        phase: 'Phase 2: Frontend',
        duration: '2-3 months',
        topics: ['React', 'TypeScript', 'State Management', 'Tailwind CSS', 'REST APIs'],
        resources: [
          { title: 'React Official Docs', url: 'https://react.dev', type: 'article' },
          { title: 'Scrimba React Course', url: 'https://scrimba.com/learn/learnreact', type: 'course' },
        ],
      },
      {
        phase: 'Phase 3: Backend',
        duration: '2-3 months',
        topics: ['Node.js', 'Express', 'MongoDB', 'PostgreSQL', 'Authentication', 'REST/GraphQL'],
        resources: [
          { title: 'Node.js Official Docs', url: 'https://nodejs.org/docs', type: 'article' },
          { title: 'MongoDB University', url: 'https://university.mongodb.com', type: 'course' },
        ],
      },
      {
        phase: 'Phase 4: DevOps & Deployment',
        duration: '1-2 months',
        topics: ['Docker', 'CI/CD', 'AWS/GCP', 'Linux', 'Nginx'],
        resources: [
          { title: 'AWS Free Tier', url: 'https://aws.amazon.com/free', type: 'course' },
        ],
      },
    ],
  },
  {
    domain: 'Data Scientist',
    description: 'Extract insights from data using statistical methods, ML models, and visualization.',
    skills: ['Python', 'Pandas', 'NumPy', 'Scikit-learn', 'TensorFlow', 'SQL', 'Tableau'],
    demandScore: 92,
    avgSalary: '₹10-30 LPA',
    growthRate: '30%',
    demand: 'High',
    trendingSkills: ['LLMs', 'PyTorch', 'MLOps', 'Feature Engineering'],
    weights: { technical: 4, creative: 1, analytical: 5, leadership: 1, communication: 2 },
    roadmap: [
      {
        phase: 'Phase 1: Programming & Math',
        duration: '2-3 months',
        topics: ['Python', 'Statistics', 'Linear Algebra', 'Calculus basics'],
        resources: [
          { title: 'Python for Data Science', url: 'https://www.kaggle.com/learn/python', type: 'course' },
          { title: 'Khan Academy Statistics', url: 'https://www.khanacademy.org/math/statistics-probability', type: 'video' },
        ],
      },
      {
        phase: 'Phase 2: Data Analysis',
        duration: '2-3 months',
        topics: ['Pandas', 'NumPy', 'Matplotlib', 'Seaborn', 'SQL', 'EDA'],
        resources: [
          { title: 'Kaggle Pandas Course', url: 'https://www.kaggle.com/learn/pandas', type: 'course' },
        ],
      },
      {
        phase: 'Phase 3: Machine Learning',
        duration: '3-4 months',
        topics: ['Scikit-learn', 'Regression', 'Classification', 'Clustering', 'Model Evaluation'],
        resources: [
          { title: 'fast.ai Practical ML', url: 'https://www.fast.ai', type: 'course' },
          { title: 'Hands-On ML (book)', url: 'https://www.oreilly.com/library/view/hands-on-machine-learning', type: 'book' },
        ],
      },
    ],
  },
  {
    domain: 'UI/UX Designer',
    description: 'Design intuitive digital experiences through research, wireframing, and prototyping.',
    skills: ['Figma', 'Adobe XD', 'User Research', 'Prototyping', 'Design Systems', 'Accessibility'],
    demandScore: 82,
    avgSalary: '₹6-18 LPA',
    growthRate: '18%',
    demand: 'High',
    trendingSkills: ['Motion Design', 'AI-Assisted Design', '3D/AR UI', 'Design Tokens'],
    weights: { technical: 2, creative: 5, analytical: 2, leadership: 1, communication: 3 },
    roadmap: [
      {
        phase: 'Phase 1: Design Fundamentals',
        duration: '1-2 months',
        topics: ['Color Theory', 'Typography', 'Layout & Grids', 'Design Principles'],
        resources: [
          { title: 'Google UX Design Certificate', url: 'https://www.coursera.org/professional-certificates/google-ux-design', type: 'course' },
        ],
      },
      {
        phase: 'Phase 2: Tools & Prototyping',
        duration: '2-3 months',
        topics: ['Figma', 'Wireframing', 'Prototyping', 'User Flows', 'Design Systems'],
        resources: [
          { title: 'Figma Tutorials', url: 'https://www.figma.com/resources/learn-design/', type: 'video' },
        ],
      },
      {
        phase: 'Phase 3: UX Research',
        duration: '2 months',
        topics: ['User Interviews', 'Usability Testing', 'A/B Testing', 'Accessibility (WCAG)'],
        resources: [
          { title: 'Nielsen Norman Group', url: 'https://www.nngroup.com', type: 'article' },
        ],
      },
    ],
  },
  {
    domain: 'Product Manager',
    description: 'Lead cross-functional teams to define, build, and launch successful products.',
    skills: ['Product Strategy', 'Roadmapping', 'Agile/Scrum', 'Data Analysis', 'Stakeholder Management'],
    demandScore: 85,
    avgSalary: '₹12-35 LPA',
    growthRate: '20%',
    demand: 'High',
    trendingSkills: ['AI Product Management', 'OKRs', 'PLG Strategy', 'Product Analytics'],
    weights: { technical: 2, creative: 2, analytical: 3, leadership: 5, communication: 4 },
    roadmap: [
      {
        phase: 'Phase 1: PM Fundamentals',
        duration: '1-2 months',
        topics: ['Product Lifecycle', 'User Stories', 'Agile/Scrum', 'OKRs', 'PRDs'],
        resources: [
          { title: 'Product School', url: 'https://productschool.com', type: 'course' },
          { title: 'Inspired by Marty Cagan', url: 'https://www.svpg.com/books/inspired/', type: 'book' },
        ],
      },
      {
        phase: 'Phase 2: Analytics & Strategy',
        duration: '2-3 months',
        topics: ['SQL basics', 'Google Analytics', 'Mixpanel', 'Competitive Analysis', 'Pricing'],
        resources: [
          { title: 'Reforge Growth Series', url: 'https://www.reforge.com', type: 'course' },
        ],
      },
    ],
  },
  {
    domain: 'Cybersecurity Analyst',
    description: 'Protect systems and networks from digital attacks, vulnerabilities, and breaches.',
    skills: ['Network Security', 'Penetration Testing', 'SIEM', 'Linux', 'Python', 'Cryptography'],
    demandScore: 90,
    avgSalary: '₹8-22 LPA',
    growthRate: '28%',
    demand: 'High',
    trendingSkills: ['Zero Trust', 'Cloud Security', 'DevSecOps', 'AI Threat Detection'],
    weights: { technical: 5, creative: 1, analytical: 4, leadership: 1, communication: 1 },
    roadmap: [
      {
        phase: 'Phase 1: Networking & Linux',
        duration: '2-3 months',
        topics: ['TCP/IP', 'Linux Commands', 'Networking Protocols', 'Firewalls'],
        resources: [
          { title: 'CompTIA Network+', url: 'https://www.comptia.org/certifications/network', type: 'course' },
          { title: 'TryHackMe', url: 'https://tryhackme.com', type: 'course' },
        ],
      },
      {
        phase: 'Phase 2: Security Fundamentals',
        duration: '3 months',
        topics: ['CompTIA Security+', 'OWASP Top 10', 'Encryption', 'Incident Response'],
        resources: [
          { title: 'Hack The Box', url: 'https://www.hackthebox.com', type: 'course' },
        ],
      },
    ],
  },
  {
    domain: 'Digital Marketing Specialist',
    description: 'Drive growth and brand awareness through SEO, social media, and data-driven campaigns.',
    skills: ['SEO/SEM', 'Google Ads', 'Social Media', 'Content Strategy', 'Analytics', 'Email Marketing'],
    demandScore: 75,
    avgSalary: '₹4-15 LPA',
    growthRate: '12%',
    demand: 'Medium',
    trendingSkills: ['AI Marketing', 'Video Content', 'Creator Economy', 'Performance Marketing'],
    weights: { technical: 1, creative: 3, analytical: 2, leadership: 2, communication: 5 },
    roadmap: [
      {
        phase: 'Phase 1: Marketing Foundations',
        duration: '1-2 months',
        topics: ['Marketing Mix', 'Brand Strategy', 'Content Marketing', 'SEO Basics'],
        resources: [
          { title: 'Google Digital Marketing', url: 'https://learndigital.withgoogle.com', type: 'course' },
          { title: 'HubSpot Academy', url: 'https://academy.hubspot.com', type: 'course' },
        ],
      },
      {
        phase: 'Phase 2: Paid & Social Media',
        duration: '2 months',
        topics: ['Google Ads', 'Facebook Ads', 'Instagram/LinkedIn Strategy', 'Analytics'],
        resources: [
          { title: 'Google Ads Certification', url: 'https://skillshop.google.com', type: 'course' },
        ],
      },
    ],
  },
];

const seedDB = async () => {
  try {
    await connectDB();

    // Clear existing data
    await Career.deleteMany({});
    await Advice.deleteMany({});
    console.log('Cleared existing careers and advice posts.');

    // Seed careers
    await Career.insertMany(careers);
    console.log(`✅ Seeded ${careers.length} career documents.`);

    // Seed a sample admin user (for testing)
    const existing = await User.findOne({ email: 'admin@nexus.com' });
    if (!existing) {
      await User.create({
        name: 'Nexus Admin',
        email: 'admin@nexus.com',
        password: 'admin123',
        role: 'admin',
      });
      console.log('✅ Admin user created: admin@nexus.com / admin123');
    }

    console.log('🎉 Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error.message);
    process.exit(1);
  }
};

seedDB();
