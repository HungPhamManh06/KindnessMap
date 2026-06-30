import axios from 'axios';

// Create Axios instance
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kindness_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle authentication errors (401/403)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Optional: handle automatic logout if token expired
      if (window.location.pathname.startsWith('/admin')) {
        localStorage.removeItem('kindness_token');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
