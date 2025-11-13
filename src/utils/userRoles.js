export const USER_ROLES = Object.freeze({
  MEMBER: 'member',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
});

const ROLE_PRIORITY = Object.freeze({
  [USER_ROLES.MEMBER]: 1,
  [USER_ROLES.ADMIN]: 2,
  [USER_ROLES.SUPER_ADMIN]: 3,
});

export function normalizeRole(role) {
  if (!role) {
    return null;
  }

  const normalized = String(role).trim().toLowerCase();

  if (normalized === USER_ROLES.MEMBER) return USER_ROLES.MEMBER;
  if (normalized === USER_ROLES.ADMIN) return USER_ROLES.ADMIN;
  if (['super_admin', 'super-admin', 'superadmin'].includes(normalized)) {
    return USER_ROLES.SUPER_ADMIN;
  }

  return null;
}

export function isMember(role) {
  return normalizeRole(role) === USER_ROLES.MEMBER;
}

export function isAdmin(role) {
  return normalizeRole(role) === USER_ROLES.ADMIN;
}

export function isSuperAdmin(role) {
  return normalizeRole(role) === USER_ROLES.SUPER_ADMIN;
}

export function hasRole(role, expectedRole) {
  const actual = normalizeRole(role);
  const expected = normalizeRole(expectedRole);
  if (!actual || !expected) {
    return false;
  }
  return actual === expected;
}

export function hasAtLeastRole(role, requiredRole) {
  const actual = normalizeRole(role);
  const required = normalizeRole(requiredRole);
  if (!actual || !required) {
    return false;
  }
  return ROLE_PRIORITY[actual] >= ROLE_PRIORITY[required];
}

export function canManageRole(actorRole, targetRole) {
  const actor = normalizeRole(actorRole);
  const target = normalizeRole(targetRole);
  if (!actor || !target) {
    return false;
  }
  return ROLE_PRIORITY[actor] > ROLE_PRIORITY[target];
}

export function getRolePriority(role) {
  const normalized = normalizeRole(role);
  return normalized ? ROLE_PRIORITY[normalized] : null;
}

export const ROLE_HIERARCHY = ROLE_PRIORITY;

