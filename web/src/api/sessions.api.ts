import apiClient from './client';

export const sessionsApi = {
  list: async (params: { therapy_id?: string; status?: string; page?: number; per_page?: number } = {}) => {
    const response = await apiClient.get('/sessions', { params });
    return response.data;
  },

  get: async (id: string) => {
    const response = await apiClient.get(`/sessions/${id}`);
    return response.data.data;
  },

  updateFee: async (id: string, session_fee: number) => {
    const response = await apiClient.patch(`/sessions/${id}`, { session_fee });
    return response.data.data;
  },

  complete: async (id: string) => {
    const response = await apiClient.post(`/sessions/${id}/complete`);
    return response.data.data;
  },

  cancel: async (id: string, reason?: string) => {
    const response = await apiClient.post(`/sessions/${id}/cancel`, { reason });
    return response.data.data;
  },

  postpone: async (id: string, new_date: string, reason?: string) => {
    const response = await apiClient.post(`/sessions/${id}/postpone`, { new_date, reason });
    return response.data.data;
  },

  confirmPostpone: async (id: string) => {
    const response = await apiClient.post(`/sessions/${id}/confirm-postpone`);
    return response.data.data;
  },

  attachMedia: async (id: string, media_url: string) => {
    const response = await apiClient.post(`/sessions/${id}/media`, { media_url });
    return response.data.data;
  }
};

export const sessionNotesApi = {
  list: async (sessionId: string) => {
    const response = await apiClient.get(`/sessions/${sessionId}/notes`);
    return response.data.data;
  },

  create: async (sessionId: string, data: { content: string; is_private: boolean }) => {
    const response = await apiClient.post(`/sessions/${sessionId}/notes`, data);
    return response.data.data;
  },

  update: async (sessionId: string, noteId: string, data: { content?: string; is_private?: boolean }) => {
    const response = await apiClient.patch(`/sessions/${sessionId}/notes/${noteId}`, data);
    return response.data.data;
  },

  delete: async (sessionId: string, noteId: string) => {
    const response = await apiClient.delete(`/sessions/${sessionId}/notes/${noteId}`);
    return response.data;
  }
};
