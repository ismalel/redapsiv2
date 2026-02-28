import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { psychologistsApi } from '../api/psychologists.api';
import { queryKeys } from '../utils/query-keys';

const STALE_TIME = 30000; // 30 seconds (Requirement Severity 2)

export const usePsychologists = (availableOnly?: boolean) => {
  return useQuery({
    queryKey: queryKeys.psychologists.all(availableOnly),
    queryFn: () => psychologistsApi.list(availableOnly),
    staleTime: STALE_TIME,
  });
};

export const usePsychologistProfile = (id: string) => {
  return useQuery({
    queryKey: queryKeys.psychologists.detail(id),
    queryFn: () => psychologistsApi.getProfile(id),
    enabled: !!id,
    staleTime: STALE_TIME,
  });
};

export const useOwnPsychologistProfile = () => {
  return useQuery({
    queryKey: queryKeys.psychologists.me,
    queryFn: () => psychologistsApi.getOwnProfile(),
    staleTime: STALE_TIME,
  });
};

export const useUpdatePsychologistProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => psychologistsApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.psychologists.me });
    },
  });
};

export const useSetAvailability = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slots: any[]) => psychologistsApi.setAvailability(slots),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.psychologists.me });
    },
  });
};
