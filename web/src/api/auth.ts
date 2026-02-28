import apiClient from './client';

export const authApi = {
  login: async (data: any) => {
    const response = await apiClient.post(`/auth/login`, data);
    return response.data;
  },
  
  register: async (data: any) => {
    const response = await apiClient.post(`/auth/register`, data);
    return response.data;
  },
  
  refresh: async (refreshToken: string) => {
    const response = await apiClient.post(`/auth/refresh`, { refresh_token: refreshToken });
    return response.data;
  },
  
  logout: async (refreshToken: string) => {
    const response = await apiClient.post(`/auth/logout`, { refresh_token: refreshToken });
    return response.data;
  }
};
