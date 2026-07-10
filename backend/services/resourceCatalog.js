/**
 * Resource Catalog — Verified Learning Resource Database
 * 
 * A comprehensive mapping of topic keywords to arrays of verified resource objects.
 * ALL URLs are verified official documentation pages, known YouTube video IDs, or trusted platform URLs.
 * NO guessed or invented URLs.
 */

const RESOURCE_CATALOG = {

  // ═══════════════════════════════════════════════════════════════
  // LANGUAGES
  // ═══════════════════════════════════════════════════════════════

  'html': [
    { title: 'MDN: HTML — Structuring the Web', url: 'https://developer.mozilla.org/en-US/docs/Learn/HTML', provider: 'Mozilla Developer Network', category: 'docs', type: 'documentation', difficulty: 'Beginner', isFree: true, duration: '4 hours', description: 'Official MDN guide to HTML elements, forms, tables, and semantic markup.', isOfficial: true },
    { title: 'HTML Full Course for Beginners', url: 'https://www.youtube.com/watch?v=mU6anWqODqg', provider: 'freeCodeCamp', category: 'youtube', type: 'video', difficulty: 'Beginner', isFree: true, duration: '4 hours', description: 'Complete HTML tutorial covering every tag, attribute, and best practice.', isOfficial: false },
    { title: 'Responsive Web Design Certification', url: 'https://www.freecodecamp.org/learn/2022/responsive-web-design/', provider: 'freeCodeCamp', category: 'platform', type: 'platform', difficulty: 'Beginner', isFree: true, duration: '300 hours', description: 'Interactive certification with hands-on HTML & CSS projects.', isOfficial: false },
    { title: 'Frontend Developer Roadmap', url: 'https://roadmap.sh/frontend', provider: 'roadmap.sh', category: 'community', type: 'article', difficulty: 'Beginner', isFree: true, duration: '30 min', description: 'Community-driven visual roadmap for frontend development.', isOfficial: false },
  ],

  'css': [
    { title: 'MDN: CSS — Styling the Web', url: 'https://developer.mozilla.org/en-US/docs/Learn/CSS', provider: 'Mozilla Developer Network', category: 'docs', type: 'documentation', difficulty: 'Beginner', isFree: true, duration: '6 hours', description: 'Official guide to selectors, box model, Flexbox, Grid, and animations.', isOfficial: true },
    { title: 'HTML & CSS Full Course', url: 'https://www.youtube.com/watch?v=mU6anWqODqg', provider: 'freeCodeCamp', category: 'youtube', type: 'video', difficulty: 'Beginner', isFree: true, duration: '4 hours', description: 'Learn responsive layouts, Flexbox, Grid, and modern CSS techniques.', isOfficial: false },
    { title: 'Responsive Web Design Certification', url: 'https://www.freecodecamp.org/learn/2022/responsive-web-design/', provider: 'freeCodeCamp', category: 'platform', type: 'platform', difficulty: 'Beginner', isFree: true, duration: '300 hours', description: 'Build 15+ projects mastering HTML and CSS fundamentals.', isOfficial: false },
  ],

  'javascript': [
    { title: 'MDN: JavaScript Guide', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide', provider: 'Mozilla Developer Network', category: 'docs', type: 'documentation', difficulty: 'Beginner', isFree: true, duration: '8 hours', description: 'Official guide to JavaScript syntax, closures, prototypes, and ES6+ features.', isOfficial: true },
    { title: 'JavaScript Full Course for Beginners', url: 'https://www.youtube.com/watch?v=PkZNo7MFNFg', provider: 'freeCodeCamp', category: 'youtube', type: 'video', difficulty: 'Beginner', isFree: true, duration: '8 hours', description: 'Complete JavaScript tutorial from variables to async/await and DOM manipulation.', isOfficial: false },
    { title: 'JavaScript Algorithms and Data Structures', url: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures-v8/', provider: 'freeCodeCamp', category: 'platform', type: 'platform', difficulty: 'Beginner', isFree: true, duration: '300 hours', description: 'Interactive certification covering JS fundamentals and algorithms.', isOfficial: false },
    { title: 'JavaScript Roadmap', url: 'https://roadmap.sh/javascript', provider: 'roadmap.sh', category: 'community', type: 'article', difficulty: 'Beginner', isFree: true, duration: '20 min', description: 'Visual learning path for mastering JavaScript.', isOfficial: false },
  ],

  'typescript': [
    { title: 'TypeScript Handbook', url: 'https://www.typescriptlang.org/docs/handbook/intro.html', provider: 'Microsoft', category: 'docs', type: 'documentation', difficulty: 'Intermediate', isFree: true, duration: '4 hours', description: 'Official handbook covering types, interfaces, generics, and configuration.', isOfficial: true },
    { title: 'TypeScript Full Course for Beginners', url: 'https://www.youtube.com/watch?v=30LWjhZzg50', provider: 'freeCodeCamp', category: 'youtube', type: 'video', difficulty: 'Intermediate', isFree: true, duration: '5 hours', description: 'Complete TypeScript tutorial from basics to advanced patterns.', isOfficial: false },
  ],

  'python': [
    { title: 'Python Official Tutorial', url: 'https://docs.python.org/3/tutorial/index.html', provider: 'Python Software Foundation', category: 'docs', type: 'documentation', difficulty: 'Beginner', isFree: true, duration: '5 hours', description: 'Official tutorial covering data types, control flow, functions, modules, and OOP.', isOfficial: true },
    { title: 'Python Full Course for Beginners', url: 'https://www.youtube.com/watch?v=rfscVS0vtbw', provider: 'freeCodeCamp', category: 'youtube', type: 'video', difficulty: 'Beginner', isFree: true, duration: '5 hours', description: 'Learn Python from scratch with hands-on examples and projects.', isOfficial: false },
    { title: 'Scientific Computing with Python', url: 'https://www.freecodecamp.org/learn/scientific-computing-with-python/', provider: 'freeCodeCamp', category: 'platform', type: 'platform', difficulty: 'Intermediate', isFree: true, duration: '300 hours', description: 'Interactive Python certification with real-world projects.', isOfficial: false },
    { title: 'Python Roadmap', url: 'https://roadmap.sh/python', provider: 'roadmap.sh', category: 'community', type: 'article', difficulty: 'Beginner', isFree: true, duration: '20 min', description: 'Community-driven visual roadmap for Python developers.', isOfficial: false },
  ],

  'java': [
    { title: 'Java Official Learning Path', url: 'https://dev.java/learn/', provider: 'Oracle', category: 'docs', type: 'documentation', difficulty: 'Beginner', isFree: true, duration: '6 hours', description: 'Official Java tutorials from Oracle covering OOP, collections, and streams.', isOfficial: true },
    { title: 'Java Full Course for Beginners', url: 'https://www.youtube.com/watch?v=GoXwIVyNvX0', provider: 'freeCodeCamp', category: 'youtube', type: 'video', difficulty: 'Beginner', isFree: true, duration: '10 hours', description: 'Complete Java course from basics to advanced OOP concepts.', isOfficial: false },
    { title: 'Java Roadmap', url: 'https://roadmap.sh/java', provider: 'roadmap.sh', category: 'community', type: 'article', difficulty: 'Beginner', isFree: true, duration: '20 min', description: 'Visual learning path for Java developers.', isOfficial: false },
  ],

  'cpp': [
    { title: 'C++ Full Course for Beginners', url: 'https://www.youtube.com/watch?v=vLnPwxZdW4Y', provider: 'freeCodeCamp', category: 'youtube', type: 'video', difficulty: 'Beginner', isFree: true, duration: '31 hours', description: 'Comprehensive C++ course from fundamentals to advanced templates.', isOfficial: false },
    { title: 'C++ Roadmap', url: 'https://roadmap.sh/cpp', provider: 'roadmap.sh', category: 'community', type: 'article', difficulty: 'Beginner', isFree: true, duration: '20 min', description: 'Visual learning path for C++ developers.', isOfficial: false },
    { title: 'HackerRank C++ Practice', url: 'https://www.hackerrank.com/domains/cpp', provider: 'HackerRank', category: 'platform', type: 'platform', difficulty: 'Intermediate', isFree: true, duration: 'Self-paced', description: 'Practice C++ problems from easy to advanced.', isOfficial: false },
  ],

  'go': [
    { title: 'Go Official Tutorial', url: 'https://go.dev/doc/tutorial/getting-started', provider: 'Go Team', category: 'docs', type: 'documentation', difficulty: 'Intermediate', isFree: true, duration: '3 hours', description: 'Official getting started guide for Go programming.', isOfficial: true },
    { title: 'Go Roadmap', url: 'https://roadmap.sh/golang', provider: 'roadmap.sh', category: 'community', type: 'article', difficulty: 'Intermediate', isFree: true, duration: '20 min', description: 'Visual learning path for Go developers.', isOfficial: false },
  ],

  'rust': [
    { title: 'The Rust Programming Language Book', url: 'https://doc.rust-lang.org/book/', provider: 'Rust Foundation', category: 'docs', type: 'documentation', difficulty: 'Intermediate', isFree: true, duration: '10 hours', description: 'Official Rust book covering ownership, borrowing, lifetimes, and concurrency.', isOfficial: true },
    { title: 'Exercism Rust Track', url: 'https://exercism.org/tracks/rust', provider: 'Exercism', category: 'platform', type: 'platform', difficulty: 'Intermediate', isFree: true, duration: 'Self-paced', description: 'Practice Rust with mentored exercises.', isOfficial: false },
  ],

  'sql': [
    { title: 'SQL Full Course for Beginners', url: 'https://www.youtube.com/watch?v=HXV3zeQKqGY', provider: 'freeCodeCamp', category: 'youtube', type: 'video', difficulty: 'Beginner', isFree: true, duration: '4 hours', description: 'Complete SQL tutorial covering SELECT, JOIN, aggregation, and subqueries.', isOfficial: false },
    { title: 'Relational Database Certification', url: 'https://www.freecodecamp.org/learn/relational-database/', provider: 'freeCodeCamp', category: 'platform', type: 'platform', difficulty: 'Intermediate', isFree: true, duration: '300 hours', description: 'Interactive certification covering PostgreSQL and bash.', isOfficial: false },
    { title: 'PostgreSQL Official Tutorial', url: 'https://www.postgresql.org/docs/current/tutorial.html', provider: 'PostgreSQL', category: 'docs', type: 'documentation', difficulty: 'Beginner', isFree: true, duration: '3 hours', description: 'Official SQL tutorial using PostgreSQL.', isOfficial: true },
  ],

  // ═══════════════════════════════════════════════════════════════
  // FRONTEND FRAMEWORKS
  // ═══════════════════════════════════════════════════════════════

  'react': [
    { title: 'React Official Quick Start', url: 'https://react.dev/learn', provider: 'React Core Team', category: 'docs', type: 'documentation', difficulty: 'Beginner', isFree: true, duration: '3 hours', description: 'Official guide to components, hooks, state, and effects.', isOfficial: true },
    { title: 'React Course for Beginners', url: 'https://www.youtube.com/watch?v=bMknfKXIFA8', provider: 'freeCodeCamp', category: 'youtube', type: 'video', difficulty: 'Beginner', isFree: true, duration: '12 hours', description: 'Complete React course building multiple real-world projects.', isOfficial: false },
    { title: 'React Roadmap', url: 'https://roadmap.sh/react', provider: 'roadmap.sh', category: 'community', type: 'article', difficulty: 'Beginner', isFree: true, duration: '20 min', description: 'Visual learning path for React developers.', isOfficial: false },
    { title: 'Front End Development Libraries', url: 'https://www.freecodecamp.org/learn/front-end-development-libraries/', provider: 'freeCodeCamp', category: 'platform', type: 'platform', difficulty: 'Intermediate', isFree: true, duration: '300 hours', description: 'Build projects with React, Redux, Bootstrap, and jQuery.', isOfficial: false },
  ],

  'angular': [
    { title: 'Angular Official Overview', url: 'https://angular.dev/overview', provider: 'Google', category: 'docs', type: 'documentation', difficulty: 'Intermediate', isFree: true, duration: '5 hours', description: 'Official Angular guide covering components, services, and routing.', isOfficial: true },
    { title: 'Angular Roadmap', url: 'https://roadmap.sh/angular', provider: 'roadmap.sh', category: 'community', type: 'article', difficulty: 'Intermediate', isFree: true, duration: '20 min', description: 'Visual learning path for Angular developers.', isOfficial: false },
  ],

  'vue': [
    { title: 'Vue.js Official Guide', url: 'https://vuejs.org/guide/introduction', provider: 'Vue.js Core Team', category: 'docs', type: 'documentation', difficulty: 'Beginner', isFree: true, duration: '4 hours', description: 'Official introduction to Vue.js reactivity, components, and composition API.', isOfficial: true },
    { title: 'Vue Roadmap', url: 'https://roadmap.sh/vue', provider: 'roadmap.sh', category: 'community', type: 'article', difficulty: 'Beginner', isFree: true, duration: '20 min', description: 'Visual learning path for Vue developers.', isOfficial: false },
  ],

  'nextjs': [
    { title: 'Next.js Official Documentation', url: 'https://nextjs.org/docs', provider: 'Vercel', category: 'docs', type: 'documentation', difficulty: 'Intermediate', isFree: true, duration: '4 hours', description: 'Official guide to routing, rendering, data fetching, and deployment.', isOfficial: true },
  ],

  'svelte': [
    { title: 'Svelte Official Docs', url: 'https://svelte.dev/docs/introduction', provider: 'Svelte Team', category: 'docs', type: 'documentation', difficulty: 'Beginner', isFree: true, duration: '3 hours', description: 'Official Svelte tutorial covering reactivity, stores, and animations.', isOfficial: true },
  ],

  'tailwind': [
    { title: 'Tailwind CSS Official Docs', url: 'https://tailwindcss.com/docs/installation', provider: 'Tailwind Labs', category: 'docs', type: 'documentation', difficulty: 'Beginner', isFree: true, duration: '2 hours', description: 'Official guide to utility-first CSS framework.', isOfficial: true },
  ],

  'redux': [
    { title: 'Redux Official Getting Started', url: 'https://redux.js.org/introduction/getting-started', provider: 'Redux Team', category: 'docs', type: 'documentation', difficulty: 'Intermediate', isFree: true, duration: '3 hours', description: 'Official guide to Redux state management with React.', isOfficial: true },
  ],

  'graphql': [
    { title: 'GraphQL Official Tutorial', url: 'https://graphql.org/learn/', provider: 'GraphQL Foundation', category: 'docs', type: 'documentation', difficulty: 'Intermediate', isFree: true, duration: '3 hours', description: 'Official introduction to queries, mutations, and schemas.', isOfficial: true },
  ],

  // ═══════════════════════════════════════════════════════════════
  // BACKEND FRAMEWORKS
  // ═══════════════════════════════════════════════════════════════

  'nodejs': [
    { title: 'Node.js Official Learning Guides', url: 'https://nodejs.org/en/learn', provider: 'Node.js Foundation', category: 'docs', type: 'documentation', difficulty: 'Intermediate', isFree: true, duration: '4 hours', description: 'Official guides covering async I/O, streams, modules, and the event loop.', isOfficial: true },
    { title: 'Node.js and Express.js Full Course', url: 'https://www.youtube.com/watch?v=Oe421EPjeBE', provider: 'freeCodeCamp', category: 'youtube', type: 'video', difficulty: 'Intermediate', isFree: true, duration: '8 hours', description: 'Build RESTful APIs with Node.js and Express from scratch.', isOfficial: false },
    { title: 'Node.js Roadmap', url: 'https://roadmap.sh/nodejs', provider: 'roadmap.sh', category: 'community', type: 'article', difficulty: 'Intermediate', isFree: true, duration: '20 min', description: 'Visual learning path for Node.js backend developers.', isOfficial: false },
    { title: 'Back End Development and APIs', url: 'https://www.freecodecamp.org/learn/back-end-development-and-apis/', provider: 'freeCodeCamp', category: 'platform', type: 'platform', difficulty: 'Intermediate', isFree: true, duration: '300 hours', description: 'Build APIs with Node.js, Express, and MongoDB.', isOfficial: false },
  ],

  'express': [
    { title: 'Node.js and Express Full Course', url: 'https://www.youtube.com/watch?v=Oe421EPjeBE', provider: 'freeCodeCamp', category: 'youtube', type: 'video', difficulty: 'Intermediate', isFree: true, duration: '8 hours', description: 'Complete Express.js course with routing, middleware, and REST APIs.', isOfficial: false },
  ],

  'django': [
    { title: 'Django Official Tutorial', url: 'https://docs.djangoproject.com/en/5.0/intro/tutorial01/', provider: 'Django Software Foundation', category: 'docs', type: 'documentation', difficulty: 'Intermediate', isFree: true, duration: '4 hours', description: 'Official step-by-step guide to building your first Django app.', isOfficial: true },
    { title: 'Django Full Course for Beginners', url: 'https://www.youtube.com/watch?v=F5mRW0jo-U4', provider: 'freeCodeCamp', category: 'youtube', type: 'video', difficulty: 'Intermediate', isFree: true, duration: '4 hours', description: 'Complete Django course building a real web application.', isOfficial: false },
  ],

  'flask': [
    { title: 'Flask Official Quickstart', url: 'https://flask.palletsprojects.com/en/stable/quickstart/', provider: 'Pallets Projects', category: 'docs', type: 'documentation', difficulty: 'Beginner', isFree: true, duration: '2 hours', description: 'Official guide to building Flask web applications.', isOfficial: true },
  ],

  'fastapi': [
    { title: 'FastAPI Official Tutorial', url: 'https://fastapi.tiangolo.com/tutorial/', provider: 'FastAPI', category: 'docs', type: 'documentation', difficulty: 'Intermediate', isFree: true, duration: '4 hours', description: 'Official tutorial covering path parameters, request bodies, and async endpoints.', isOfficial: true },
  ],

  'spring': [
    { title: 'Spring Official Guides', url: 'https://spring.io/guides', provider: 'VMware', category: 'docs', type: 'documentation', difficulty: 'Intermediate', isFree: true, duration: '5 hours', description: 'Official guides for Spring Boot, Spring MVC, and Spring Data.', isOfficial: true },
    { title: 'Spring Boot Roadmap', url: 'https://roadmap.sh/spring-boot', provider: 'roadmap.sh', category: 'community', type: 'article', difficulty: 'Intermediate', isFree: true, duration: '20 min', description: 'Visual learning path for Spring Boot developers.', isOfficial: false },
  ],

  'dotnet': [
    { title: '.NET Official Learning Path', url: 'https://learn.microsoft.com/en-us/dotnet/', provider: 'Microsoft', category: 'docs', type: 'documentation', difficulty: 'Intermediate', isFree: true, duration: '6 hours', description: 'Official .NET documentation and tutorials from Microsoft.', isOfficial: true },
  ],

  // ═══════════════════════════════════════════════════════════════
  // DATABASES
  // ═══════════════════════════════════════════════════════════════

  'mongodb': [
    { title: 'MongoDB Getting Started Tutorial', url: 'https://www.mongodb.com/docs/manual/tutorial/getting-started/', provider: 'MongoDB', category: 'docs', type: 'documentation', difficulty: 'Beginner', isFree: true, duration: '3 hours', description: 'Official guide to CRUD operations, indexing, and aggregation.', isOfficial: true },
  ],

  'postgresql': [
    { title: 'PostgreSQL Official Tutorial', url: 'https://www.postgresql.org/docs/current/tutorial.html', provider: 'PostgreSQL', category: 'docs', type: 'documentation', difficulty: 'Beginner', isFree: true, duration: '3 hours', description: 'Official tutorial covering SQL basics, joins, and database design.', isOfficial: true },
  ],

  'redis': [
    { title: 'Redis Getting Started Guide', url: 'https://redis.io/docs/latest/develop/get-started/', provider: 'Redis', category: 'docs', type: 'documentation', difficulty: 'Intermediate', isFree: true, duration: '2 hours', description: 'Official guide to caching, pub/sub, and data structures.', isOfficial: true },
  ],

  'firebase': [
    { title: 'Firebase Official Documentation', url: 'https://firebase.google.com/docs', provider: 'Google', category: 'docs', type: 'documentation', difficulty: 'Beginner', isFree: true, duration: '3 hours', description: 'Official guide to authentication, Firestore, and cloud functions.', isOfficial: true },
  ],

  'supabase': [
    { title: 'Supabase Official Documentation', url: 'https://supabase.com/docs', provider: 'Supabase', category: 'docs', type: 'documentation', difficulty: 'Beginner', isFree: true, duration: '3 hours', description: 'Official guide to auth, database, storage, and real-time subscriptions.', isOfficial: true },
  ],

  // ═══════════════════════════════════════════════════════════════
  // DEVOPS & CLOUD
  // ═══════════════════════════════════════════════════════════════

  'docker': [
    { title: 'Docker Getting Started Guide', url: 'https://docs.docker.com/get-started/', provider: 'Docker', category: 'docs', type: 'documentation', difficulty: 'Intermediate', isFree: true, duration: '2 hours', description: 'Official guide to containerization, Dockerfiles, and Docker Compose.', isOfficial: true },
    { title: 'Docker Full Course', url: 'https://www.youtube.com/watch?v=fqMOX6JJhGo', provider: 'freeCodeCamp', category: 'youtube', type: 'video', difficulty: 'Intermediate', isFree: true, duration: '6 hours', description: 'Complete Docker tutorial from basics to multi-container applications.', isOfficial: false },
    { title: 'DevOps Roadmap', url: 'https://roadmap.sh/devops', provider: 'roadmap.sh', category: 'community', type: 'article', difficulty: 'Intermediate', isFree: true, duration: '20 min', description: 'Visual learning path for DevOps engineers.', isOfficial: false },
  ],

  'kubernetes': [
    { title: 'Kubernetes Basics Tutorial', url: 'https://kubernetes.io/docs/tutorials/kubernetes-basics/', provider: 'CNCF', category: 'docs', type: 'documentation', difficulty: 'Advanced', isFree: true, duration: '4 hours', description: 'Official tutorial covering pods, deployments, services, and scaling.', isOfficial: true },
    { title: 'Kubernetes Full Course', url: 'https://www.youtube.com/watch?v=X48VuDVv0do', provider: 'TechWorld with Nana', category: 'youtube', type: 'video', difficulty: 'Advanced', isFree: true, duration: '4 hours', description: 'Complete Kubernetes tutorial for beginners.', isOfficial: false },
  ],

  'aws': [
    { title: 'AWS Skill Builder', url: 'https://skillbuilder.aws/', provider: 'Amazon Web Services', category: 'platform', type: 'platform', difficulty: 'Intermediate', isFree: true, duration: 'Self-paced', description: 'Official AWS digital training and certification preparation.', isOfficial: true },
    { title: 'AWS Certified Cloud Practitioner Course', url: 'https://www.youtube.com/watch?v=k1RI5locZE4', provider: 'freeCodeCamp', category: 'youtube', type: 'video', difficulty: 'Beginner', isFree: true, duration: '14 hours', description: 'Full exam preparation course for AWS Cloud Practitioner.', isOfficial: false },
    { title: 'AWS Roadmap', url: 'https://roadmap.sh/aws', provider: 'roadmap.sh', category: 'community', type: 'article', difficulty: 'Intermediate', isFree: true, duration: '20 min', description: 'Visual learning path for AWS cloud engineers.', isOfficial: false },
  ],

  'azure': [
    { title: 'Microsoft Learn: Azure Training', url: 'https://learn.microsoft.com/en-us/training/azure/', provider: 'Microsoft', category: 'docs', type: 'documentation', difficulty: 'Intermediate', isFree: true, duration: 'Self-paced', description: 'Official Azure training paths and certifications from Microsoft.', isOfficial: true },
  ],

  'gcp': [
    { title: 'Google Cloud Training', url: 'https://cloud.google.com/training', provider: 'Google', category: 'platform', type: 'platform', difficulty: 'Intermediate', isFree: true, duration: 'Self-paced', description: 'Official Google Cloud skills boost and certification paths.', isOfficial: true },
  ],

  'terraform': [
    { title: 'Terraform Official Tutorials', url: 'https://developer.hashicorp.com/terraform/tutorials', provider: 'HashiCorp', category: 'docs', type: 'documentation', difficulty: 'Advanced', isFree: true, duration: '4 hours', description: 'Official tutorials for infrastructure as code with Terraform.', isOfficial: true },
  ],

  'git': [
    { title: 'Pro Git Book', url: 'https://git-scm.com/book/en/v2', provider: 'Git Community', category: 'docs', type: 'documentation', difficulty: 'Beginner', isFree: true, duration: '6 hours', description: 'Official Git reference covering branching, merging, rebasing, and workflows.', isOfficial: true },
    { title: 'Git and GitHub for Beginners', url: 'https://www.youtube.com/watch?v=RGOj5yH7evk', provider: 'freeCodeCamp', category: 'youtube', type: 'video', difficulty: 'Beginner', isFree: true, duration: '1 hour', description: 'Learn Git commands, branching, and GitHub collaboration.', isOfficial: false },
  ],

  'linux': [
    { title: 'Linux Roadmap', url: 'https://roadmap.sh/linux', provider: 'roadmap.sh', category: 'community', type: 'article', difficulty: 'Beginner', isFree: true, duration: '20 min', description: 'Visual learning path for Linux system administration.', isOfficial: false },
  ],

  // ═══════════════════════════════════════════════════════════════
  // AI / MACHINE LEARNING
  // ═══════════════════════════════════════════════════════════════

  'machine learning': [
    { title: 'Machine Learning Full Course', url: 'https://www.youtube.com/watch?v=NWONeJKn6kc', provider: 'freeCodeCamp', category: 'youtube', type: 'video', difficulty: 'Intermediate', isFree: true, duration: '10 hours', description: 'Complete ML course covering regression, classification, and neural networks.', isOfficial: false },
    { title: 'Machine Learning with Python', url: 'https://www.freecodecamp.org/learn/machine-learning-with-python/', provider: 'freeCodeCamp', category: 'platform', type: 'platform', difficulty: 'Intermediate', isFree: true, duration: '300 hours', description: 'Interactive certification building 5 ML projects.', isOfficial: false },
    { title: 'Kaggle Learn', url: 'https://www.kaggle.com/learn', provider: 'Kaggle', category: 'platform', type: 'platform', difficulty: 'Beginner', isFree: true, duration: 'Self-paced', description: 'Short interactive courses on ML, deep learning, and data science.', isOfficial: false },
    { title: 'AI/ML Roadmap', url: 'https://roadmap.sh/ai-data-scientist', provider: 'roadmap.sh', category: 'community', type: 'article', difficulty: 'Intermediate', isFree: true, duration: '20 min', description: 'Visual learning path for AI and data science careers.', isOfficial: false },
  ],

  'deep learning': [
    { title: 'PyTorch Official Tutorials', url: 'https://pytorch.org/tutorials/', provider: 'Meta AI', category: 'docs', type: 'documentation', difficulty: 'Advanced', isFree: true, duration: '6 hours', description: 'Official tutorials for deep learning with PyTorch.', isOfficial: true },
    { title: 'TensorFlow Official Tutorials', url: 'https://www.tensorflow.org/tutorials', provider: 'Google', category: 'docs', type: 'documentation', difficulty: 'Advanced', isFree: true, duration: '6 hours', description: 'Official tutorials for deep learning with TensorFlow and Keras.', isOfficial: true },
  ],

  'pytorch': [
    { title: 'PyTorch Official Tutorials', url: 'https://pytorch.org/tutorials/', provider: 'Meta AI', category: 'docs', type: 'documentation', difficulty: 'Advanced', isFree: true, duration: '6 hours', description: 'Official tutorials covering tensors, autograd, neural networks, and vision.', isOfficial: true },
  ],

  'tensorflow': [
    { title: 'TensorFlow Official Tutorials', url: 'https://www.tensorflow.org/tutorials', provider: 'Google', category: 'docs', type: 'documentation', difficulty: 'Advanced', isFree: true, duration: '6 hours', description: 'Official guides for image classification, NLP, and generative models.', isOfficial: true },
  ],

  'huggingface': [
    { title: 'Hugging Face Transformers Docs', url: 'https://huggingface.co/docs/transformers/index', provider: 'Hugging Face', category: 'docs', type: 'documentation', difficulty: 'Advanced', isFree: true, duration: '5 hours', description: 'Official documentation for state-of-the-art NLP models and pipelines.', isOfficial: true },
  ],

  'scikit-learn': [
    { title: 'Scikit-learn Official Tutorial', url: 'https://scikit-learn.org/stable/tutorial/index.html', provider: 'Scikit-learn', category: 'docs', type: 'documentation', difficulty: 'Intermediate', isFree: true, duration: '4 hours', description: 'Official tutorials for classification, regression, and clustering.', isOfficial: true },
  ],

  // ═══════════════════════════════════════════════════════════════
  // DATA STRUCTURES, ALGORITHMS & INTERVIEW
  // ═══════════════════════════════════════════════════════════════

  'data structures': [
    { title: 'Data Structures Full Course', url: 'https://www.youtube.com/watch?v=8hly31xKli0', provider: 'freeCodeCamp', category: 'youtube', type: 'video', difficulty: 'Intermediate', isFree: true, duration: '8 hours', description: 'Complete data structures course in Python with visualizations.', isOfficial: false },
    { title: 'LeetCode Practice', url: 'https://leetcode.com', provider: 'LeetCode', category: 'platform', type: 'platform', difficulty: 'Intermediate', isFree: true, duration: 'Self-paced', description: 'Practice coding problems for technical interview preparation.', isOfficial: false },
  ],

  'algorithms': [
    { title: 'Data Structures and Algorithms', url: 'https://www.youtube.com/watch?v=8hly31xKli0', provider: 'freeCodeCamp', category: 'youtube', type: 'video', difficulty: 'Intermediate', isFree: true, duration: '8 hours', description: 'Learn sorting, searching, graph algorithms, and dynamic programming.', isOfficial: false },
    { title: 'HackerRank Algorithm Practice', url: 'https://www.hackerrank.com/domains/algorithms', provider: 'HackerRank', category: 'platform', type: 'platform', difficulty: 'Intermediate', isFree: true, duration: 'Self-paced', description: 'Practice algorithm problems from easy to advanced.', isOfficial: false },
  ],

  'system design': [
    { title: 'System Design Roadmap', url: 'https://roadmap.sh/system-design', provider: 'roadmap.sh', category: 'community', type: 'article', difficulty: 'Advanced', isFree: true, duration: '30 min', description: 'Visual guide to scalability, load balancing, caching, and microservices.', isOfficial: false },
  ],

  'interview preparation': [
    { title: 'LeetCode', url: 'https://leetcode.com', provider: 'LeetCode', category: 'platform', type: 'platform', difficulty: 'Intermediate', isFree: true, duration: 'Self-paced', description: 'The industry standard platform for coding interview preparation.', isOfficial: false },
    { title: 'HackerRank Interview Prep', url: 'https://www.hackerrank.com/domains', provider: 'HackerRank', category: 'platform', type: 'platform', difficulty: 'Intermediate', isFree: true, duration: 'Self-paced', description: 'Practice data structures, algorithms, and language-specific problems.', isOfficial: false },
  ],

  'competitive programming': [
    { title: 'CodeWars', url: 'https://www.codewars.com', provider: 'CodeWars', category: 'platform', type: 'platform', difficulty: 'Intermediate', isFree: true, duration: 'Self-paced', description: 'Practice coding challenges with community solutions and rankings.', isOfficial: false },
  ],

  // ═══════════════════════════════════════════════════════════════
  // SECURITY
  // ═══════════════════════════════════════════════════════════════

  'cybersecurity': [
    { title: 'Cybersecurity Roadmap', url: 'https://roadmap.sh/cyber-security', provider: 'roadmap.sh', category: 'community', type: 'article', difficulty: 'Intermediate', isFree: true, duration: '20 min', description: 'Visual learning path for cybersecurity professionals.', isOfficial: false },
    { title: 'Microsoft Security Training', url: 'https://learn.microsoft.com/en-us/training/browse/?subjects=security', provider: 'Microsoft', category: 'platform', type: 'platform', difficulty: 'Intermediate', isFree: true, duration: 'Self-paced', description: 'Official Microsoft security training and certification paths.', isOfficial: true },
  ],

  // ═══════════════════════════════════════════════════════════════
  // MOBILE & OTHER
  // ═══════════════════════════════════════════════════════════════

  'flutter': [
    { title: 'Flutter Full Course for Beginners', url: 'https://www.youtube.com/watch?v=VPvVD8t02U8', provider: 'freeCodeCamp', category: 'youtube', type: 'video', difficulty: 'Beginner', isFree: true, duration: '37 hours', description: 'Build complete mobile apps with Flutter and Dart.', isOfficial: false },
    { title: 'Flutter Roadmap', url: 'https://roadmap.sh/flutter', provider: 'roadmap.sh', category: 'community', type: 'article', difficulty: 'Beginner', isFree: true, duration: '20 min', description: 'Visual learning path for Flutter mobile developers.', isOfficial: false },
  ],

  'react native': [
    { title: 'React Native Roadmap', url: 'https://roadmap.sh/react-native', provider: 'roadmap.sh', category: 'community', type: 'article', difficulty: 'Intermediate', isFree: true, duration: '20 min', description: 'Visual learning path for React Native mobile developers.', isOfficial: false },
  ],

  'blockchain': [
    { title: 'Blockchain Roadmap', url: 'https://roadmap.sh/blockchain', provider: 'roadmap.sh', category: 'community', type: 'article', difficulty: 'Advanced', isFree: true, duration: '20 min', description: 'Visual learning path for blockchain and Web3 developers.', isOfficial: false },
  ],

  'game development': [
    { title: 'Game Development Roadmap', url: 'https://roadmap.sh/game-developer', provider: 'roadmap.sh', category: 'community', type: 'article', difficulty: 'Intermediate', isFree: true, duration: '20 min', description: 'Visual learning path for game developers.', isOfficial: false },
  ],

  // ═══════════════════════════════════════════════════════════════
  // CAREER & GENERAL
  // ═══════════════════════════════════════════════════════════════

  'open source': [
    { title: 'How to Contribute to Open Source', url: 'https://opensource.guide/how-to-contribute/', provider: 'GitHub', category: 'docs', type: 'article', difficulty: 'Beginner', isFree: true, duration: '1 hour', description: 'Official GitHub guide to finding and contributing to open source projects.', isOfficial: true },
  ],

  'api design': [
    { title: 'API Design Roadmap', url: 'https://roadmap.sh/api-design', provider: 'roadmap.sh', category: 'community', type: 'article', difficulty: 'Intermediate', isFree: true, duration: '20 min', description: 'Visual guide to REST, GraphQL, and API best practices.', isOfficial: false },
  ],

  'devops': [
    { title: 'DevOps Roadmap', url: 'https://roadmap.sh/devops', provider: 'roadmap.sh', category: 'community', type: 'article', difficulty: 'Intermediate', isFree: true, duration: '20 min', description: 'Visual learning path for DevOps engineers.', isOfficial: false },
    { title: 'Docker Getting Started Guide', url: 'https://docs.docker.com/get-started/', provider: 'Docker', category: 'docs', type: 'documentation', difficulty: 'Intermediate', isFree: true, duration: '2 hours', description: 'Official guide to containerization, Dockerfiles, and Docker Compose.', isOfficial: true },
  ],
};

module.exports = { RESOURCE_CATALOG };
