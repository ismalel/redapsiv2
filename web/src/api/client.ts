import axios from 'axios';
import { authStorage } from '../utils/auth-storage';

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Inject Bearer token
apiClient.interceptors.request.use((config) => {
  const token = authStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle expired tokens / Unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = authStorage.getRefreshToken();

      if (refreshToken) {
        try {
          const response = await axios.post('/api/auth/refresh', { refresh_token: refreshToken });
          const { access_token, refresh_token } = response.data.data;
          
          authStorage.setAccessToken(access_token);
          authStorage.setRefreshToken(refresh_token);
          
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          authStorage.clear();
          window.location.href = '/iniciar-sesion';
          return Promise.reject(refreshError);
        }
      } else {
        authStorage.clear();
        window.location.href = '/iniciar-sesion';
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
