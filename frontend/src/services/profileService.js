import api from './api';

export const profileService = {
  // Core profile
  getProfile: () => api.get('/profile'),
  saveProfile: (data) => api.post('/profile/save', data),

  // Granular reads
  getCompletion: () => api.get('/profile/completion'),
  getSkills: () => api.get('/profile/skills'),
  getProjects: () => api.get('/profile/projects'),

  // AI features
  aiEnhanceProject: (data) => api.post('/profile/ai-enhance-project', data),
  analyzeProfile: () => api.post('/profile/analyze'),
  refreshAI: () => api.post('/profile/refresh-ai'),

  // Resume
  uploadResume: (formData) => api.post('/profile/upload-resume', formData),
  mergeResume: (data) => api.post('/profile/merge-resume', data),

  // Delete operations
  deleteProject: (id) => api.delete(`/profile/project/${id}`),
  deleteCertificate: (id) => api.delete(`/profile/certificate/${id}`),
  deleteExperience: (id) => api.delete(`/profile/experience/${id}`),
  deleteAchievement: (id) => api.delete(`/profile/achievement/${id}`),
  deleteEducation: (id) => api.delete(`/profile/education/${id}`),
};
