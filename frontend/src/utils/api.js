import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Queue API
export const queueAPI = {
  getStatus: () => api.get('/queue/status'),
  join: (data) => api.post('/queue/join', data),
  cancel: (id) => api.delete(`/queue/cancel/${id}`),
};

// Staff API
export const staffAPI = {
  login: (password) => api.post('/staff/login', { password }),
  getNext: () => api.get('/staff/next'),
  admitNext: () => api.post('/staff/admit-next'),
  skip: (id, reason) => api.post('/staff/skip', { id, reason }),
};

// Analytics API
export const analyticsAPI = {
  getStats: (startDate, endDate) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    return api.get('/analytics/stats', { params });
  },
};

export default api;
