export const hasRole = (user: { role: string } | null, role: string) => {
  if (!user) return false;
  
  // ADMIN_PSYCHOLOGIST has both roles
  if (user.role === 'ADMIN_PSYCHOLOGIST') {
    return role === 'ADMIN' || role === 'PSYCHOLOGIST' || role === 'ADMIN_PSYCHOLOGIST';
  }
  
  return user.role === role;
};
