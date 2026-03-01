import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionsApi, sessionNotesApi } from '../api/sessions.api';
import { queryKeys } from '../utils/query-keys';

const STALE_TIME = 30000;

export const useSessions = (filters: { therapy_id?: string; status?: string; page?: number; per_page?: number } = {}) => {
  return useQuery({
    queryKey: queryKeys.sessions.all(filters),
    queryFn: () => sessionsApi.list(filters),
    staleTime: STALE_TIME,
  });
};

export const useSession = (id: string) => {
  return useQuery({
    queryKey: queryKeys.sessions.detail(id),
    queryFn: () => sessionsApi.get(id),
    staleTime: STALE_TIME,
    enabled: !!id,
  });
};

export const useCompleteSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sessionsApi.complete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.detail(id) });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
};

export const useCancelSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => sessionsApi.cancel(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.detail(id) });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
};

export const usePostponeSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, new_date, reason }: { id: string; new_date: string; reason?: string }) => 
      sessionsApi.postpone(id, new_date, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.detail(id) });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
};

export const useConfirmPostpone = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sessionsApi.confirmPostpone(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.detail(id) });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
};

export const useAttachSessionMedia = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, media_url }: { id: string; media_url: string }) => 
      sessionsApi.attachMedia(id, media_url),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.detail(id) });
    },
  });
};

export const useSessionNotes = (sessionId: string) => {
  return useQuery({
    queryKey: queryKeys.sessions.notes(sessionId),
    queryFn: () => sessionNotesApi.list(sessionId),
    staleTime: STALE_TIME,
    enabled: !!sessionId,
  });
};

export const useCreateSessionNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, content, is_private }: { sessionId: string; content: string; is_private: boolean }) => 
      sessionNotesApi.create(sessionId, { content, is_private }),
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.notes(sessionId) });
    },
  });
};
