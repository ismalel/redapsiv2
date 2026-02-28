import apiClient from './client';

export const psychologistsApi = {
  list: async (availableOnly?: boolean) => {
    const response = await apiClient.get('/psychologists', {
      params: { available: availableOnly }
    });
    return response.data.data;
  },

  getProfile: async (id: string) => {
    const response = await apiClient.get(`/psychologists/${id}`);
    return response.data.data;
  },

  getOwnProfile: async () => {
    const response = await apiClient.get('/psychologists/me/profile');
    return response.data.data;
  },

  updateProfile: async (data: any) => {
    const response = await apiClient.put('/psychologists/me/profile', data);
    return response.data.data;
  },

  setAvailability: async (slots: any[]) => {
    const response = await apiClient.put('/psychologists/me/availability', slots);
    return response.data.data;
  }
};
