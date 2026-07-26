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
      const requestUrl = error.config?.url || '';
      // Không xử lý cho các request đăng nhập/đăng ký (401 ở đây nghĩa là sai thông tin, không phải hết phiên)
      const isAuthAttempt = ['/auth/login', '/auth/register', '/auth/google', '/auth/reset-password']
        .some((path) => requestUrl.includes(path));
      const hadToken = Boolean(localStorage.getItem('kindness_token'));

      if (!isAuthAttempt && hadToken) {
        // Token hết hạn hoặc không hợp lệ: xoá token và thông báo cho AuthContext đăng xuất
        localStorage.removeItem('kindness_token');
        window.dispatchEvent(new Event('kindnessmap:session-expired'));

        if (window.location.pathname.startsWith('/admin')) {
          window.location.href = '/';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
