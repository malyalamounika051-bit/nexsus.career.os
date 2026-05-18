import api from './api';

export const adviceService = {
  getAll: (params) => api.get('/advice', { params }),
  create: (data) => api.post('/advice', data),
  toggleLike: (id) => api.put(`/advice/${id}/like`),
  delete: (id) => api.delete(`/advice/${id}`),
};

export const careerService = {
  getAll: () => api.get('/careers'),
  getById: (id) => api.get(`/careers/${id}`),
  getMarketInsights: () => api.get('/careers/market-insights'),
  generateRoadmap: (query) => api.post('/careers/generate-roadmap', { query }, { timeout: 180000 }),
  getMyRoadmaps: () => api.get('/careers/my-roadmaps'),
  deleteRoadmap: (id) => api.delete(`/careers/roadmap/${id}`),
  updateProgress: (id, data) => api.patch(`/careers/roadmap/${id}/progress`, data),
};

export const jobService = {
  searchJobs: (params) => api.post('/jobs/search', params, { timeout: 120000 }), // timeout for AI generation
  analyzeFit: (data) => api.post('/jobs/analyze-fit', data, { timeout: 60000 }),
  getSavedJobs: () => api.get('/jobs/saved'),
  saveJob: (jobData) => api.post('/jobs/saved', jobData),
  removeSavedJob: (jobId) => api.delete(`/jobs/saved/${jobId}`),
  aiMatchJobs: (formData) => api.post('/jobs/ai-match', formData, { 
    timeout: 180000 // Extended timeout for PDF parsing and AI batch matching
  }),
};
