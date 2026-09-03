import axios, { AxiosInstance } from "axios";
import { CacheService, CacheOptions } from "../services/cache.service";
import {
  CreateGroupDto,
  CreatePermissionDto,
  CreateRoleDto,
  Group,
  GroupsResponse,
  Permission,
  PermissionsResponse,
  Role,
  RolesResponse,
  UpdateGroupDto,
  UpdatePermissionDto,
  UpdateRoleDto,
  UsersResponse,
  User,
  AssignUserDto,
  UserIamDetailsResponse,
} from "../types/iam.dto";

export class IamApiClient {
  private client: AxiosInstance;
  private static cache: CacheService;

  constructor(config: {
    baseURL: string;
    headers?: Record<string, string>;
    cacheOptions?: CacheOptions;
  }) {
    this.client = axios.create({
      baseURL: `${config.baseURL}/iam`,
      headers: {
        "Content-Type": "application/json",
        ...config.headers,
      },
    });

    if (!IamApiClient.cache) {
      IamApiClient.cache = new CacheService({
        ...config.cacheOptions,
        storageKey: "iam_cache",
      });
    }
  }

  private handleError(error: any): Error {
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    }
    return error;
  }

  // Helper method to generate entity hash
  private generateEntitiesHash(entities: any[]): string {
    try {
      const ids = entities
        .map((entity) => entity.id)
        .sort()
        .join(",");
      return btoa(ids);
    } catch (error) {
      console.error("Error generating entities hash:", error);
      return Date.now().toString();
    }
  }

  // Clear cache methods
  clearCache(entity: string, id?: string): void {
    if (id) {
      // Clear specific entity cache entries
      IamApiClient.cache.clear(`${entity}:${id}`);
    } else {
      // Clear all entity cache entries
      IamApiClient.cache.clear(`${entity}:all`);
    }
  }

  // Permission endpoints
  async getPermissions(): Promise<PermissionsResponse> {
    const cacheKey = `permissions:all`;
    const cachedData = IamApiClient.cache.get<PermissionsResponse>(cacheKey);
    const cachedHash = IamApiClient.cache.getHash(cacheKey);

    try {
      const params: any = {
        lastUpdate: cachedData?.timestamp,
        entitiesHash: cachedHash,
      };

      const response = await this.client.get<PermissionsResponse>(
        "/permissions",
        {
          params,
        }
      );

      // If we get 304, use cached data
      if (!response.data && cachedData) {
        return cachedData.data;
      }

      const permissions = response.data.permissions;
      const entitiesHash =
        response.data.metadata?.entitiesHash ||
        this.generateEntitiesHash(permissions);

      // Store in cache
      IamApiClient.cache.set(
        cacheKey,
        {
          permissions,
          total: response.data.total,
          metadata: { entitiesHash },
        },
        entitiesHash
      );

      return {
        permissions,
        total: response.data.total,
        metadata: { entitiesHash },
      };
    } catch (error) {
      if (cachedData) {
        return cachedData.data;
      }
      throw this.handleError(error);
    }
  }

  async getPermission(id: string): Promise<Permission> {
    const cacheKey = `permission:${id}`;
    const cachedData = IamApiClient.cache.get<Permission>(cacheKey);

    try {
      const response = await this.client.get<Permission>(`/permissions/${id}`);
      const permission = response.data;

      // Store in cache
      IamApiClient.cache.set(cacheKey, permission);

      return permission;
    } catch (error) {
      if (cachedData) {
        return cachedData.data;
      }
      throw this.handleError(error);
    }
  }

  async createPermission(data: CreatePermissionDto): Promise<Permission> {
    try {
      const response = await this.client.post<Permission>("/permissions", data);
      // Clear permissions cache
      this.clearCache("permissions");
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updatePermission(
    id: string,
    data: UpdatePermissionDto
  ): Promise<Permission> {
    try {
      const response = await this.client.put<Permission>(
        `/permissions/${id}`,
        data
      );
      // Clear specific permission cache and permissions list cache
      this.clearCache("permission", id);
      this.clearCache("permissions");
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deletePermission(id: string): Promise<void> {
    try {
      await this.client.delete(`/permissions/${id}`);
      // Clear specific permission cache and permissions list cache
      this.clearCache("permission", id);
      this.clearCache("permissions");
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Role endpoints
  async getRoles(): Promise<RolesResponse> {
    const cacheKey = `roles:all`;
    const cachedData = IamApiClient.cache.get<RolesResponse>(cacheKey);
    const cachedHash = IamApiClient.cache.getHash(cacheKey);

    try {
      const params: any = {
        lastUpdate: cachedData?.timestamp,
        entitiesHash: cachedHash,
      };

      const response = await this.client.get<RolesResponse>("/roles", {
        params,
      });

      // If we get 304, use cached data
      if (!response.data && cachedData) {
        return cachedData.data;
      }

      const roles = response.data.roles;
      const entitiesHash =
        response.data.metadata?.entitiesHash ||
        this.generateEntitiesHash(roles);

      // Store in cache
      IamApiClient.cache.set(
        cacheKey,
        {
          roles,
          total: response.data.total,
          metadata: { entitiesHash },
        },
        entitiesHash
      );

      return {
        roles,
        total: response.data.total,
        metadata: { entitiesHash },
      };
    } catch (error) {
      if (cachedData) {
        return cachedData.data;
      }
      throw this.handleError(error);
    }
  }

  async getRole(id: string): Promise<Role> {
    const cacheKey = `role:${id}`;
    const cachedData = IamApiClient.cache.get<Role>(cacheKey);

    try {
      const response = await this.client.get<Role>(`/roles/${id}`);
      const role = response.data;

      // Store in cache
      IamApiClient.cache.set(cacheKey, role);

      return role;
    } catch (error) {
      if (cachedData) {
        return cachedData.data;
      }
      throw this.handleError(error);
    }
  }

  async createRole(data: CreateRoleDto): Promise<Role> {
    try {
      const response = await this.client.post<Role>("/roles", data);
      // Clear roles cache
      this.clearCache("roles");
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateRole(id: string, data: UpdateRoleDto): Promise<Role> {
    try {
      const response = await this.client.put<Role>(`/roles/${id}`, data);
      // Clear specific role cache and roles list cache
      this.clearCache("role", id);
      this.clearCache("roles");
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteRole(id: string): Promise<void> {
    try {
      await this.client.delete(`/roles/${id}`);
      // Clear specific role cache and roles list cache
      this.clearCache("role", id);
      this.clearCache("roles");
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Group endpoints
  async getGroups(): Promise<GroupsResponse> {
    const cacheKey = `groups:all`;
    const cachedData = IamApiClient.cache.get<GroupsResponse>(cacheKey);
    const cachedHash = IamApiClient.cache.getHash(cacheKey);

    try {
      const params: any = {
        lastUpdate: cachedData?.timestamp,
        entitiesHash: cachedHash,
      };

      const response = await this.client.get<GroupsResponse>("/groups", {
        params,
      });

      // If we get 304, use cached data
      if (!response.data && cachedData) {
        return cachedData.data;
      }

      const groups = response.data.groups;
      const entitiesHash =
        response.data.metadata?.entitiesHash ||
        this.generateEntitiesHash(groups);

      // Store in cache
      IamApiClient.cache.set(
        cacheKey,
        {
          groups,
          total: response.data.total,
          metadata: { entitiesHash },
        },
        entitiesHash
      );

      return {
        groups,
        total: response.data.total,
        metadata: { entitiesHash },
      };
    } catch (error) {
      if (cachedData) {
        return cachedData.data;
      }
      throw this.handleError(error);
    }
  }

  async getGroup(id: string): Promise<Group> {
    const cacheKey = `group:${id}`;
    const cachedData = IamApiClient.cache.get<Group>(cacheKey);

    try {
      const response = await this.client.get<Group>(`/groups/${id}`);
      const group = response.data;

      // Store in cache
      IamApiClient.cache.set(cacheKey, group);

      return group;
    } catch (error) {
      if (cachedData) {
        return cachedData.data;
      }
      throw this.handleError(error);
    }
  }

  async createGroup(data: CreateGroupDto): Promise<Group> {
    try {
      const response = await this.client.post<Group>("/groups", data);
      // Clear groups cache
      this.clearCache("groups");
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateGroup(id: string, data: UpdateGroupDto): Promise<Group> {
    try {
      const response = await this.client.put<Group>(`/groups/${id}`, data);
      // Clear specific group cache and groups list cache
      this.clearCache("group", id);
      this.clearCache("groups");
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteGroup(id: string): Promise<void> {
    try {
      await this.client.delete(`/groups/${id}`);
      // Clear specific group cache and groups list cache
      this.clearCache("group", id);
      this.clearCache("groups");
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // User IAM management endpoints
  async getUserIamDetails(userId: string): Promise<User> {
    try {
      const response = await this.client.get<User>(`/users/${userId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getAllUsersIamDetails(): Promise<UsersResponse> {
    try {
      const response = await this.client.get<UsersResponse>("/users");
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getCurrentUserIamDetails(): Promise<UserIamDetailsResponse> {
    try {
      const response =
        await this.client.get<UserIamDetailsResponse>("/users/me");
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async assignUserAccess(data: AssignUserDto): Promise<UserIamDetailsResponse> {
    try {
      const response = await this.client.post<UserIamDetailsResponse>(
        "/users/assign",
        data
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
