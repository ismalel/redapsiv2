import apiClient from './client';

export const uploadApi = {
  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post('/upload?folder=avatars', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data.data; // Returns { url: "/uploads/avatars/..." }
  },

  uploadFile: async (file: File, folder: 'avatars' | 'sessions' | 'chat' | 'events' = 'sessions') => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post(`/upload?folder=${folder}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data.data;
  }
};
