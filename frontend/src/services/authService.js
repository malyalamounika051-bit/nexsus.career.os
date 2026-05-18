import api from './api';

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  demoLogin: () => api.post('/auth/demo'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  logout: () => api.post('/auth/logout'),
  // Google OAuth — checks if backend is reachable first
  googleLogin: async () => {
    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error('Backend down');
      // Backend is up, try OAuth redirect
      window.location.href = '/api/auth/google';
    } catch {
      throw new Error('Cannot reach backend. Make sure the backend server is running.');
    }
  },
};
