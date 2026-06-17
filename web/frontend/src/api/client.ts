import axios from 'axios';
import { safeGetItem, safeRemoveItem } from '../utils/safeStorage';

// Use window.location.hostname so local network testing on mobile devices routes to the correct computer IP instead of localhost on the phone
const API_BASE_URL = import.meta.env?.VITE_API_URL || (import.meta.env?.PROD ? '' : `http://${window.location.hostname}:8000/api`);

if (import.meta.env?.PROD && !API_BASE_URL) {
  console.error("CRITICAL: VITE_API_URL is not set in production environment variables.");
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const stored = safeGetItem('prepmate-auth');
  if (stored) {
    try {
      const { state } = JSON.parse(stored);
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`;
      }
    } catch {
      // ignore parse errors
    }
  }
  return config;
});

// Response interceptor for auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      safeRemoveItem('prepmate-auth');
      window.dispatchEvent(new Event('auth-unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: { email: string; password: string; firstName: string; lastName: string }) =>
    api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data: { firstName: string; lastName: string }) =>
    api.put('/auth/update-profile', data),
};

// Resume API
export const resumeAPI = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/resume/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  analyze: (resumeId: string) => api.post(`/resume/analyze/${resumeId}`),
  match: (resumeId: string, jobDescription: string) => api.post(`/resume/match/${resumeId}`, { jobDescription }),
  getSkills: () => api.get('/resume/skills'),
};

// Interview API
export const interviewAPI = {
  setup: (config: { role: string; company: string; persona: string; rigorLevel: number }) =>
    api.post('/interview/setup', config),
  getQuestions: (sessionId: string) =>
    api.get(`/interview/${sessionId}/questions`),
  submitAnswer: (questionId: string, answer: { text: string; confidence: string; duration: number }) =>
    api.post(`/interview/answer/${questionId}`, answer),
  getFeedback: (sessionId: string) =>
    api.get(`/interview/${sessionId}/feedback`),
};

// Analytics API
export const analyticsAPI = {
  getReadiness: () => api.get('/analytics/readiness'),
  getWeaknesses: () => api.get('/analytics/weaknesses'),
  getHistory: () => api.get('/analytics/history'),
};

// Company API
export const companyAPI = {
  getPrep: (company: string) => api.get(`/interview/company/${company}`),
};
