export const ADMIN_ROLES = ['Head Admin', 'Sub-admin', 'Finance Admin', 'Academic Admin', 'Support Admin'] as const;
export type AdminRoleName = typeof ADMIN_ROLES[number];
export type AdminPermission = 'payments' | 'academic' | 'support' | 'configuration' | 'roles' | 'audit';
const permissions: Record<AdminRoleName, readonly AdminPermission[]> = {
  'Head Admin': ['payments', 'academic', 'support', 'configuration', 'roles', 'audit'],
  // Preserve existing operational access without granting role administration.
  'Sub-admin': ['payments', 'academic', 'support', 'configuration', 'audit'],
  'Finance Admin': ['payments', 'audit'],
  'Academic Admin': ['academic'],
  'Support Admin': ['support'],
};
export function adminPermissions(role: unknown, status: unknown, master = false): readonly AdminPermission[] {
  if (master) return permissions['Head Admin'];
  if (status !== 'Active' || typeof role !== 'string' || !ADMIN_ROLES.includes(role as AdminRoleName)) return [];
  return permissions[role as AdminRoleName];
}
export function permissionForAdminPath(path: string): AdminPermission {
  if (/\/payments|\/transactions|\/iba|\/reward-eligibility|\/approval-inbox/.test(path)) return 'payments';
  if (/\/audit/.test(path)) return 'audit';
  if (/\/roles|\/admin-management/.test(path)) return 'roles';
  if (/\/schedule|\/question-bank|\/leaderboard/.test(path)) return 'academic';
  if (/\/support|\/chat/.test(path)) return 'support';
  return 'configuration';
}
