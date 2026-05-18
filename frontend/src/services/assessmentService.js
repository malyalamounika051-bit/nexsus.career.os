import api from './api';

export const assessmentService = {
  submit: (answers) => api.post('/assessments', { answers }),
  getAll: () => api.get('/assessments'),
  getById: (id) => api.get(`/assessments/${id}`),
};
