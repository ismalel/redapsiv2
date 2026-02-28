import axios from 'axios';
import { authStorage } from '../utils/auth-storage';

const API_BASE = '/api';

export const authApi = {
  login: async (data: any) => {
    const response = await axios.post(`${API_BASE}/auth/login`, data);
    return response.data;
  },
  
  register: async (data: any) => {
    const response = await axios.post(`${API_BASE}/auth/register`, data);
    return response.data;
  },
  
  refresh: async (refreshToken: string) => {
    const response = await axios.post(`${API_BASE}/auth/refresh`, { refresh_token: refreshToken });
    return response.data;
  },
  
  logout: async (refreshToken: string) => {
    const response = await axios.post(`${API_BASE}/auth/logout`, { refresh_token: refreshToken });
    return response.data;
  }
};
