import apiClient from './client';

export const therapiesApi = {
  list: async (page = 1, perPage = 20) => {
    const response = await apiClient.get('/therapies', {
      params: { page, per_page: perPage }
    });
    return response.data; // Standard paginated response
  },

  get: async (id: string) => {
    const response = await apiClient.get(`/therapies/${id}`);
    return response.data.data;
  },

  create: async (data: any) => {
    const response = await apiClient.post('/therapies', data);
    return response.data.data;
  }
};

export const therapyRequestsApi = {
  list: async () => {
    const response = await apiClient.get('/therapy-requests');
    return response.data.data;
  },

  respond: async (id: string, status: 'ACCEPTED' | 'REJECTED') => {
    const response = await apiClient.patch(`/therapy-requests/${id}`, { status });
    return response.data.data;
  }
};
