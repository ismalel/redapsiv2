import { useMutation } from '@tanstack/react-query';
import { uploadApi } from '../api/upload.api';

export const useUpload = () => {
  return useMutation({
    mutationFn: ({ file, folder }: { file: File, folder?: 'avatars' | 'sessions' | 'chat' | 'events' }) => 
      uploadApi.uploadFile(file, folder),
  });
};
