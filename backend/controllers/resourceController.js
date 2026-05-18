const RESOURCES_DB = {
  'web development': [
    { name: 'MDN Web Docs', url: 'https://developer.mozilla.org', type: 'Documentation', rating: 5 },
    { name: 'freeCodeCamp', url: 'https://freecodecamp.org', type: 'Tutorial', rating: 5 },
    { name: 'W3Schools', url: 'https://w3schools.com', type: 'Tutorial', rating: 4 },
    { name: 'Codecademy', url: 'https://codecademy.com', type: 'Interactive Course', rating: 4 }
  ],
  'data science': [
    { name: 'Kaggle', url: 'https://kaggle.com', type: 'Practice & Datasets', rating: 5 },
    { name: 'DataCamp', url: 'https://datacamp.com', type: 'Online Course', rating: 4 },
    { name: 'Fast.ai', url: 'https://fast.ai', type: 'Free Course', rating: 5 },
    { name: 'Coursera - ML Specialization', url: 'https://coursera.org', type: 'Certification', rating: 5 }
  ],
  'machine learning': [
    { name: 'Andrew Ng ML Course', url: 'https://coursera.org/learn/machine-learning', type: 'Course', rating: 5 },
    { name: 'Scikit-learn Documentation', url: 'https://scikit-learn.org', type: 'Documentation', rating: 5 },
    { name: 'TensorFlow', url: 'https://tensorflow.org', type: 'Framework & Docs', rating: 5 },
    { name: 'Towards Data Science', url: 'https://towardsdatascience.com', type: 'Articles', rating: 4 }
  ],
  'python': [
    { name: 'Python Official Docs', url: 'https://python.org/docs', type: 'Documentation', rating: 5 },
    { name: 'Real Python', url: 'https://realpython.com', type: 'Tutorials', rating: 5 },
    { name: 'Automate the Boring Stuff', url: 'https://automatetheboringstuff.com', type: 'Free Book', rating: 5 },
    { name: 'Codecademy Python', url: 'https://codecademy.com/learn/learn-python-3', type: 'Interactive', rating: 4 }
  ],
  'javascript': [
    { name: 'JavaScript.info', url: 'https://javascript.info', type: 'Tutorial', rating: 5 },
    { name: 'Eloquent JavaScript', url: 'https://eloquentjavascript.net', type: 'Free Book', rating: 5 },
    { name: 'MDN JavaScript Guide', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript', type: 'Docs', rating: 5 },
    { name: 'freeCodeCamp JS', url: 'https://youtube.com/results?search_query=freecodecamp+javascript', type: 'Video', rating: 4 }
  ],
  'react': [
    { name: 'React Official Docs', url: 'https://react.dev', type: 'Documentation', rating: 5 },
    { name: 'React Router', url: 'https://reactrouter.com', type: 'Library Docs', rating: 5 },
    { name: 'Scrimba React', url: 'https://scrimba.com', type: 'Interactive Course', rating: 4 },
    { name: 'CSS-Tricks React', url: 'https://css-tricks.com', type: 'Articles', rating: 4 }
  ],
  'node.js': [
    { name: 'Node.js Official', url: 'https://nodejs.org/en/docs', type: 'Documentation', rating: 5 },
    { name: 'Express.js Guide', url: 'https://expressjs.com', type: 'Framework Docs', rating: 5 },
    { name: 'The Node Beginner Book', url: 'https://www.nodebeginner.org', type: 'Free Book', rating: 4 },
    { name: 'Nodeschool', url: 'https://nodeschool.io', type: 'Interactive Tutorial', rating: 4 }
  ],
  'database': [
    { name: 'MongoDB University', url: 'https://university.mongodb.com', type: 'Course', rating: 5 },
    { name: 'PostgreSQL Docs', url: 'https://postgresql.org/docs', type: 'Documentation', rating: 5 },
    { name: 'SQL Tutorial', url: 'https://sqltutorial.org', type: 'Tutorial', rating: 4 },
    { name: 'Database Design Basics', url: 'https://www.studytonight.com/dbms', type: 'Course', rating: 4 }
  ],
  'ui/ux design': [
    { name: 'Nielsen Norman Group', url: 'https://nngroup.com', type: 'Articles & Courses', rating: 5 },
    { name: 'Figma Learning', url: 'https://figma.com/resources', type: 'Tutorials', rating: 5 },
    { name: 'Dribbble', url: 'https://dribbble.com', type: 'Inspiration', rating: 4 },
    { name: 'Interaction Design Foundation', url: 'https://interaction-design.org', type: 'Courses', rating: 5 }
  ],
  'devops': [
    { name: 'Docker Documentation', url: 'https://docs.docker.com', type: 'Docs', rating: 5 },
    { name: 'Kubernetes.io', url: 'https://kubernetes.io/docs', type: 'Documentation', rating: 5 },
    { name: 'Linux Academy', url: 'https://linuxacademy.com', type: 'Courses', rating: 4 },
    { name: 'Terraform Docs', url: 'https://terraform.io/docs', type: 'Documentation', rating: 5 }
  ],
  'cloud computing': [
    { name: 'AWS Training', url: 'https://aws.amazon.com/training', type: 'Courses', rating: 5 },
    { name: 'Google Cloud Learn', url: 'https://cloud.google.com/learn', type: 'Resources', rating: 5 },
    { name: 'Azure Learn', url: 'https://learn.microsoft.com/en-us/azure', type: 'Documentation', rating: 4 },
    { name: 'Cloud Academy', url: 'https://cloudacademy.com', type: 'Courses', rating: 4 }
  ]
};

// Helper function to find matching resources
const findResourcesByTopic = (topic) => {
  const lowerTopic = topic.toLowerCase().trim();
  
  // Direct match
  if (RESOURCES_DB[lowerTopic]) {
    return RESOURCES_DB[lowerTopic];
  }
  
  // Partial match
  for (const [key, resources] of Object.entries(RESOURCES_DB)) {
    if (key.includes(lowerTopic) || lowerTopic.includes(key)) {
      return resources;
    }
  }
  
  // No match found
  return null;
};

// @desc    Get learning resources for a topic
// @route   POST /api/resources/search
// @access  Private
const searchResources = async (req, res) => {
  try {
    const { topic } = req.body;

    if (!topic || topic.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a topic to search for resources' 
      });
    }

    const resources = findResourcesByTopic(topic);

    if (!resources) {
      // Return all available topics if no match found
      const topics = Object.keys(RESOURCES_DB);
      return res.status(200).json({
        success: true,
        data: {
          found: false,
          message: `We couldn't find resources for "${topic}". Here are available topics:`,
          availableTopics: topics,
          suggestions: topics.filter(t => 
            t.includes(topic.toLowerCase()) || topic.toLowerCase().includes(t)
          ).slice(0, 5)
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        found: true,
        topic: topic,
        resources: resources,
        totalResources: resources.length
      }
    });
  } catch (error) {
    console.error('Search Resources Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search resources'
    });
  }
};

// @desc    Get all available topics
// @route   GET /api/resources/topics
// @access  Private
const getTopics = async (req, res) => {
  try {
    const topics = Object.keys(RESOURCES_DB);
    res.status(200).json({
      success: true,
      data: {
        topics: topics,
        totalTopics: topics.length
      }
    });
  } catch (error) {
    console.error('Get Topics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch topics'
    });
  }
};

module.exports = {
  searchResources,
  getTopics
};
