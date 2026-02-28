import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { psychologistsApi } from '../api/psychologists.api';

export const usePsychologists = (availableOnly?: boolean) => {
  return useQuery({
    queryKey: ['psychologists', { availableOnly }],
    queryFn: () => psychologistsApi.list(availableOnly),
  });
};

export const usePsychologistProfile = (id: string) => {
  return useQuery({
    queryKey: ['psychologist', id],
    queryFn: () => psychologistsApi.getProfile(id),
    enabled: !!id,
  });
};

export const useOwnPsychologistProfile = () => {
  return useQuery({
    queryKey: ['psychologist', 'me'],
    queryFn: () => psychologistsApi.getOwnProfile(),
  });
};

export const useUpdatePsychologistProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => psychologistsApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['psychologist', 'me'] });
    },
  });
};

export const useSetAvailability = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slots: any[]) => psychologistsApi.setAvailability(slots),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['psychologist', 'me'] });
    },
  });
};
