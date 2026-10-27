export const subscriptionOffer = { amount: 29, currency: 'USD', interval: null } as const;

export function assertAdminChange(actorId: string, targetId: string, enabled: boolean) {
  if (actorId === targetId && !enabled) throw new Error("You can't remove your own admin access");
}

export function validatePassword(password: string, confirmation: string) {
  if (password.length < 8) return 'Use at least 8 characters.';
  if (password !== confirmation) return 'Passwords do not match.';
  return null;
}