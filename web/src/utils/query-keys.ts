export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  users: {
    all: ['users'] as const,
    detail: (id: string) => ['users', id] as const,
  },
  psychologists: {
    all: (availableOnly?: boolean) => ['psychologists', { availableOnly }] as const,
    detail: (id: string) => ['psychologist', id] as const,
    me: ['psychologist', 'me'] as const,
  },
  consultants: {
    me: ['consultant', 'me'] as const,
    onboarding: (id: string) => ['consultant', id, 'onboarding'] as const,
  },
};
