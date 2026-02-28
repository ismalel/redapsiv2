import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { therapiesApi, therapyRequestsApi } from '../api/therapies.api';
import { queryKeys } from '../utils/query-keys';

const STALE_TIME = 30000;

export const useTherapies = (page = 1, perPage = 20) => {
  return useQuery({
    queryKey: queryKeys.therapies.all(page, perPage),
    queryFn: () => therapiesApi.list(page, perPage),
    staleTime: STALE_TIME,
  });
};

export const useCreateTherapy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => therapiesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.therapies.all() });
    },
  });
};

export const useTherapyRequests = () => {
  return useQuery({
    queryKey: queryKeys.therapies.requests,
    queryFn: () => therapyRequestsApi.list(),
    staleTime: STALE_TIME,
  });
};

export const useRespondTherapyRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACCEPTED' | 'REJECTED' }) => 
      therapyRequestsApi.respond(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.therapies.requests });
      queryClient.invalidateQueries({ queryKey: queryKeys.therapies.all() });
    },
  });
};
