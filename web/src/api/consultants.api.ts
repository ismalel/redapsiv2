import apiClient from './client';

export const consultantsApi = {
  getOwnProfile: async () => {
    const response = await apiClient.get('/consultants/me/profile');
    return response.data.data;
  },

  updateProfile: async (data: any) => {
    const response = await apiClient.put('/consultants/me/profile', data);
    return response.data.data;
  },

  getOnboarding: async (id: string) => {
    const response = await apiClient.get(`/consultants/${id}/onboarding`);
    return response.data.data;
  },

  submitOnboardingStep: async (id: string, step: number, data: any) => {
    const response = await apiClient.put(`/consultants/${id}/onboarding/${step}`, data);
    return response.data.data;
  }
};
