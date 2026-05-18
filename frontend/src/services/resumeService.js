import api from './api';

export const resumeService = {
  getAll: () => api.get(`/resumes`),
  getOne: (id) => api.get(`/resumes/${id}`),
  getPublic: (token) => api.get(`/resumes/public/${token}`),
  create: (data) => api.post(`/resumes`, data),
  update: (id, data) => api.put(`/resumes/${id}`, data),
  delete: (id) => api.delete(`/resumes/${id}`),
  
  // AI Features
  optimize: (id) => api.post(`/resumes/${id}/optimize`, {}),
  generateSummary: (data) => api.post(`/resumes/ai/generate-summary`, data),
  improveAchievement: (data) => api.post(`/resumes/ai/improve-achievement`, data),
};
