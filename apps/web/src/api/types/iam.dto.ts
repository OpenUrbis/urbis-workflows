import { PrivacyLevelEnum } from "@open-urbis/types";

// Types for the IAM module
export interface Permission {
  id: string;
  name: string;
  code: string; // e.g., "workflow-schema:write:create"
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  accessLevel: PrivacyLevelEnum;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  accessLevel: PrivacyLevelEnum;
  roles: Role[];
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  accessLevel: PrivacyLevelEnum;
  groups: Group[];
  directRoles: Role[];
  directPermissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

// DTOs for API requests
export interface CreatePermissionDto {
  name: string;
  code: string;
  description: string;
}

export interface UpdatePermissionDto {
  name?: string;
  code?: string;
  description?: string;
}

export interface CreateRoleDto {
  name: string;
  description: string;
  permissionIds: string[];
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  permissionIds?: string[];
}

export interface CreateGroupDto {
  name: string;
  description: string;
  roleIds: string[];
}

export interface UpdateGroupDto {
  name?: string;
  description?: string;
  roleIds?: string[];
}

export interface AssignUserDto {
  userId: string;
  groupIds?: string[];
  roleIds?: string[];
  permissionIds?: string[];
}

// Response types
export interface PermissionsResponse {
  permissions: Permission[];
  total: number;
  metadata?: {
    entitiesHash?: string;
  };
}

export interface RolesResponse {
  roles: Role[];
  total: number;
  metadata?: {
    entitiesHash?: string;
  };
}

export interface GroupsResponse {
  groups: Group[];
  total: number;
  metadata?: {
    entitiesHash?: string;
  };
}

export interface UsersResponse {
  users: User[];
  total: number;
  metadata?: {
    entitiesHash?: string;
  };
}

export interface UserIamDetailsResponse {
  id: string;
  name: string;
  email: string;
  accessLevel: PrivacyLevelEnum;
  groups: Group[];
  directRoles: Role[];
  directPermissions: Permission[];
  createdAt: string;
  updatedAt: string;
}
