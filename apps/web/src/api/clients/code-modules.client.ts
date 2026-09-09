import axios, { AxiosInstance } from "axios";
import {
  CreateCodeModuleHttpDto,
  UpdateCodeModuleHttpDto,
  CreateCodeModuleResponse,
  FindAllCodeModulesResponse,
  FindOneCodeModuleResponse,
  UpdateCodeModuleResponse,
  RemoveCodeModuleResponse,
  FindAllCodeModuleVersionsResponse,
  FindOneCodeModuleVersionResponse,
  CopyCodeModuleHttpDto,
} from "../types/code-modules.dto";
import { CacheService, CacheOptions } from "../services/cache.service";
import { createAuthenticatedAxios } from "./base-api.client";

export class CodeModulesApiClient {
  private client: AxiosInstance;
  private static cache: CacheService;

  constructor(config: {
    baseURL: string;
    headers?: Record<string, string>;
    cacheOptions?: CacheOptions;
  }) {
    this.client = createAuthenticatedAxios({
      baseURL: `${config.baseURL}/code-modules`,
      headers: config.headers,
    });

    // Initialize cache as a static instance if it doesn't exist
    if (!CodeModulesApiClient.cache) {
      CodeModulesApiClient.cache = new CacheService({
        ...config.cacheOptions,
        storageKey: "code_modules_cache",
      });
    }
  }

  // Get all code modules with caching
  async findAll(): Promise<FindAllCodeModulesResponse> {
    const cacheKey = `code-modules:all`;
    const cachedData =
      CodeModulesApiClient.cache.get<FindAllCodeModulesResponse>(cacheKey);
    const cachedHash = CodeModulesApiClient.cache.getHash(cacheKey);

    try {
      const params: any = {
        lastUpdate: cachedData?.timestamp,
        entitiesHash: cachedHash,
      };

      const response = await this.client.get<FindAllCodeModulesResponse>("/", {
        params,
      });

      // If we get 304, use cached data
      if (!response.data && cachedData) {
        return cachedData.data;
      }

      const newData = response.data.modules;
      const newHash = response.data.metadata.entitiesHash;

      // If hashes don't match, replace everything as we don't know what was deleted
      if (cachedHash !== newHash) {
        CodeModulesApiClient.cache.set(
          cacheKey,
          {
            modules: newData,
            metadata: { entitiesHash: newHash },
          },
          newHash
        );
        return { modules: newData, metadata: { entitiesHash: newHash } };
      }

      // If we have cached data and lastUpdate was provided, merge updates
      if (cachedData && params.lastUpdate) {
        CodeModulesApiClient.cache.update(
          cacheKey,
          { modules: newData },
          (cached, fresh) => {
            const mergedModules = [...cached.modules];

            fresh.modules.forEach((newModule: any) => {
              const existingIndex = mergedModules.findIndex(
                (m) => m.id === newModule.id
              );
              if (existingIndex >= 0) {
                // Update existing module
                mergedModules[existingIndex] = newModule;
              } else {
                // Add new module
                mergedModules.push(newModule);
              }
            });

            return {
              modules: mergedModules,
            };
          },
          newHash
        );

        return CodeModulesApiClient.cache.get<FindAllCodeModulesResponse>(
          cacheKey
        )!.data;
      }

      // First request or no cached data
      CodeModulesApiClient.cache.set(
        cacheKey,
        {
          modules: newData,
          metadata: { entitiesHash: newHash },
        },
        newHash
      );
      return {
        modules: newData,
        metadata: { entitiesHash: newHash },
      };
    } catch (error) {
      if (cachedData) {
        return cachedData.data;
      }
      throw this.handleError(error);
    }
  }

  // Get code module by ID with caching
  async findOne(id: string): Promise<FindOneCodeModuleResponse> {
    const cacheKey = `code-module:${id}`;
    const cachedData =
      CodeModulesApiClient.cache.get<FindOneCodeModuleResponse>(cacheKey);

    try {
      const params: any = {};

      // Add lastUpdate if we have cached data
      if (cachedData) {
        params.lastUpdate = cachedData.timestamp;
      }

      const response = await this.client.get(`/${id}`, { params });

      // If we get 304, use cached data
      if (response.data === "" && cachedData) {
        return cachedData.data;
      }

      // If we have new data, update cache and return
      const newData = response.data;
      CodeModulesApiClient.cache.set(cacheKey, newData);
      return newData;
    } catch (error) {
      if (cachedData) {
        return cachedData.data;
      }
      throw this.handleError(error);
    }
  }

  // Get code module versions with caching
  async findOneVersions(
    id: string,
    page?: number,
    pageSize?: number
  ): Promise<FindAllCodeModuleVersionsResponse> {
    const cacheKey = `code-module:${id}:versions:${page}:${pageSize}`;
    const cachedData =
      CodeModulesApiClient.cache.get<FindAllCodeModuleVersionsResponse>(
        cacheKey
      );

    try {
      const params: any = { page, pageSize };

      if (cachedData) {
        params.lastUpdate = cachedData.timestamp;
      }

      const response = await this.client.get(`/${id}/versions`, { params });

      if (response.data === "" && cachedData) {
        return cachedData.data;
      }

      const newData = response.data;

      if (cachedData && params.lastUpdate) {
        // Merge strategy: Update versions while maintaining pagination
        CodeModulesApiClient.cache.update(
          cacheKey,
          newData,
          (cached, fresh) => {
            const mergedVersions = [...cached.versions];

            fresh.versions.forEach((newVersion: any) => {
              const existingIndex = mergedVersions.findIndex(
                (v) => v.id === newVersion.id
              );
              if (existingIndex >= 0) {
                // Update existing version
                mergedVersions[existingIndex] = newVersion;
              } else {
                // Add new version
                mergedVersions.push(newVersion);
              }
            });

            return {
              versions: mergedVersions.sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              ),
              pagination: fresh.pagination,
            };
          }
        );

        return CodeModulesApiClient.cache.get<FindAllCodeModuleVersionsResponse>(
          cacheKey
        )!.data;
      }

      CodeModulesApiClient.cache.set(cacheKey, newData);
      return newData;
    } catch (error) {
      if (cachedData) {
        return cachedData.data;
      }
      throw this.handleError(error);
    }
  }

  // Get specific code module version with caching
  async findOneVersion(
    id: string,
    version: string
  ): Promise<FindOneCodeModuleVersionResponse> {
    const cacheKey = `code-module:${id}:version:${version}`;
    const cachedData =
      CodeModulesApiClient.cache.get<FindOneCodeModuleVersionResponse>(
        cacheKey
      );

    try {
      const params: any = {};

      if (cachedData) {
        params.lastUpdate = cachedData.timestamp;
      }

      const response = await this.client.get(`/${id}/versions/${version}`, {
        params,
      });

      if (response.data === "" && cachedData) {
        return cachedData.data;
      }

      const newData = response.data;
      CodeModulesApiClient.cache.set(cacheKey, newData);
      return newData;
    } catch (error) {
      if (cachedData) {
        return cachedData.data;
      }
      throw this.handleError(error);
    }
  }

  // Clear cache methods
  clearCache(id?: string): void {
    if (id) {
      // Clear specific code module cache entries
      CodeModulesApiClient.cache.clear(`code-module:${id}`);
      CodeModulesApiClient.cache.clear(`code-module:${id}:versions`);
    } else {
      // Clear all code modules cache
      CodeModulesApiClient.cache.clear();
    }
  }

  // Mutation methods (these should clear relevant cache entries)
  async create(
    data: CreateCodeModuleHttpDto
  ): Promise<CreateCodeModuleResponse> {
    try {
      const response = await this.client.post("/", data);
      this.clearCache(); // Clear all cache as the list has changed
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async copy(id: string): Promise<CopyCodeModuleHttpDto> {
    try {
      const response = await this.client.post(`/${id}/copy`);
      this.clearCache(); // Clear all cache as the list has changed
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async update(
    id: string,
    data: UpdateCodeModuleHttpDto
  ): Promise<UpdateCodeModuleResponse> {
    try {
      const response = await this.client.put(`/${id}`, data);
      this.clearCache(id); // Clear cache for this module
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async remove(id: string): Promise<RemoveCodeModuleResponse> {
    try {
      const response = await this.client.delete(`/${id}`);
      this.clearCache(id); // Clear cache for this module
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;

      switch (status) {
        case 400:
          return new Error(`Bad Request: ${message}`);
        case 401:
          return new Error("Unauthorized");
        case 404:
          return new Error(`Not Found: ${message}`);
        case 500:
          return new Error("Internal Server Error");
        case 304:
          return new Error("Not Modified");
        default:
          return new Error(`API Error: ${message}`);
      }
    }
    return error;
  }
}
