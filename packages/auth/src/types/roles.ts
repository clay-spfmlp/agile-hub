export type UserRole = 'USER' | 'SCRUM_MASTER' | 'ADMIN' | 'SUPER_ADMIN';

export interface RoleConfig {
  key: UserRole;
  label: string;
  description: string;
  color: {
    bg: string;
    text: string;
    border: string;
    icon: string;
  };
  permissions: string[];
  hierarchy: number; // Higher number = more permissions
}

export const ROLES_CONFIG: Record<UserRole, RoleConfig> = {
  USER: {
    key: 'USER',
    label: 'Team Member',
    description: 'Standard team member with basic access',
    color: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      border: 'border-blue-200',
      icon: 'text-blue-600',
    },
    permissions: ['read_planning', 'participate_voting'],
    hierarchy: 1,
  },
  SCRUM_MASTER: {
    key: 'SCRUM_MASTER',
    label: 'Scrum Master',
    description: 'Team lead with planning and facilitation access',
    color: {
      bg: 'bg-purple-100',
      text: 'text-purple-800',
      border: 'border-purple-200',
      icon: 'text-purple-600',
    },
    permissions: ['read_planning', 'participate_voting', 'create_planning', 'manage_team'],
    hierarchy: 2,
  },
  ADMIN: {
    key: 'ADMIN',
    label: 'Administrator',
    description: 'System administrator with full platform access',
    color: {
      bg: 'bg-orange-100',
      text: 'text-orange-800',
      border: 'border-orange-200',
      icon: 'text-orange-600',
    },
    permissions: ['read_planning', 'participate_voting', 'create_planning', 'manage_team', 'manage_users', 'manage_system'],
    hierarchy: 3,
  },
  SUPER_ADMIN: {
    key: 'SUPER_ADMIN',
    label: 'Super Administrator',
    description: 'Full system access with advanced configuration',
    color: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-200',
      icon: 'text-red-600',
    },
    permissions: ['*'], // All permissions
    hierarchy: 4,
  },
};

export const AVAILABLE_ROLES = Object.values(ROLES_CONFIG);

export const getRoleConfig = (role: UserRole): RoleConfig => {
  return ROLES_CONFIG[role];
};

export const getRoleLabel = (role: UserRole): string => {
  return ROLES_CONFIG[role]?.label || role;
};

export const getRoleColor = (role: UserRole) => {
  return ROLES_CONFIG[role]?.color || ROLES_CONFIG.USER.color;
};

export const canAssignRole = (assignerRole: UserRole, targetRole: UserRole): boolean => {
  const assignerHierarchy = ROLES_CONFIG[assignerRole]?.hierarchy || 0;
  const targetHierarchy = ROLES_CONFIG[targetRole]?.hierarchy || 0;
  
  // Can only assign roles with lower or equal hierarchy
  return assignerHierarchy >= targetHierarchy;
};

export const getAssignableRoles = (assignerRole: UserRole): UserRole[] => {
  const assignerHierarchy = ROLES_CONFIG[assignerRole]?.hierarchy || 0;
  
  return AVAILABLE_ROLES
    .filter(role => role.hierarchy <= assignerHierarchy)
    .map(role => role.key);
}; 