import axios from 'axios';

// Use relative path in development (proxied by vite) or env var in production
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Queue API - adapted to match backend endpoints
export const queueAPI = {
  getStatus: async () => {
    // Backend returns array, we format it to match frontend expectations
    const response = await api.get('/queue');
    const queue = response.data;
    return {
      data: {
        queue: queue.map((customer, index) => ({
          ...customer,
          position: index + 1,
          id: customer.customerId || customer._id,
          _id: customer._id || customer.customerId,
        })),
        queueLength: queue.length,
      }
    };
  },
  join: (data) => {
    // Backend expects: { id, name, partySize, email }
    // Generate unique customerId if not provided
    const payload = {
      id: data.id || `customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      partySize: parseInt(data.partySize),
      email: data.email,
    };
    return api.post('/queue/join', payload);
  },
  cancel: (id) => api.delete(`/queue/cancel/${id}`),
  getSeated: () => api.get('/queue/seated'),
  markFinished: (id) => api.delete(`/queue/finished/${id}`),
  deleteByEmail: (email) => api.delete('/queue/delete-by-email', { data: { email } }),
};

// Staff API - using queue endpoints since staff endpoints don't exist
export const staffAPI = {
  login: async (password) => {
    // Backend doesn't have staff login, simulate it for frontend compatibility
    if (password === 'staff123' || password === 'admin') {
      return { data: { token: 'staff_token_' + Date.now(), success: true } };
    }
    throw new Error('Invalid password');
  },
  getNext: async () => {
    const response = await api.get('/queue');
    const queue = response.data;
    return {
      data: {
        nextParty: queue.length > 0 ? {
          ...queue[0],
          id: queue[0].customerId || queue[0]._id,
          _id: queue[0]._id || queue[0].customerId,
        } : null,
      }
    };
  },
  admitNext: () => api.post('/queue/seat'),
  skip: async (id, reason) => {
    // Backend doesn't have skip endpoint, for now just seat the next one
    console.warn('Skip endpoint not implemented in backend, seating next customer instead');
    return api.post('/queue/seat');
  },
};

// Analytics API - connected to backend
export const analyticsAPI = {
  getStats: async (startDate, endDate) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    return api.get('/analytics/stats', { params });
  },
  getSeated: () => api.get('/analytics/seated'),
};

export default api;

