import axios, { AxiosInstance } from "axios";
import {
  CreateConstantVariableHttpDto,
  UpdateConstantVariableHttpDto,
  CreateConstantVariableResponse,
  FindAllConstantVariablesResponse,
  FindOneConstantVariableResponse,
  FindAllConstantVariableVersionsResponse,
  FindOneConstantVariableVersionResponse,
  UpdateConstantVariableResponse,
  RemoveConstantVariableResponse,
  CopyConstantVariableResponse,
} from "../types/constant-variables.dto";
import { CacheService, CacheOptions } from "../services/cache.service";
import { createAuthenticatedAxios } from "./base-api.client";

export class ConstantVariablesApiClient {
  private client: AxiosInstance;
  private static cache: CacheService;

  constructor(config: {
    baseURL: string;
    headers?: Record<string, string>;
    cacheOptions?: CacheOptions;
  }) {
    this.client = createAuthenticatedAxios({
      baseURL: `${config.baseURL}/constant-variables`,
      headers: config.headers,
    });

    // Initialize cache as a static instance if it doesn't exist
    if (!ConstantVariablesApiClient.cache) {
      ConstantVariablesApiClient.cache = new CacheService({
        ...config.cacheOptions,
        storageKey: "constant_variables_cache",
      });
    }
  }

  // Get all constant variables with caching
  async findAll(): Promise<FindAllConstantVariablesResponse> {
    const cacheKey = `constant-variables:all`;
    const cachedData =
      ConstantVariablesApiClient.cache.get<FindAllConstantVariablesResponse>(
        cacheKey
      );
    const cachedHash = ConstantVariablesApiClient.cache.getHash(cacheKey);

    try {
      const params: any = {
        lastUpdate: cachedData?.timestamp,
        entitiesHash: cachedHash,
      };

      const response = await this.client.get<FindAllConstantVariablesResponse>(
        "/",
        {
          params,
        }
      );

      // If we get 304, use cached data
      if (!response.data && cachedData) {
        return cachedData.data;
      }

      const newData = response.data.variables;
      const newHash = response.data.metadata.entitiesHash;

      // If hashes don't match, replace everything as we don't know what was deleted
      if (cachedHash !== newHash) {
        ConstantVariablesApiClient.cache.set(
          cacheKey,
          {
            variables: newData,
            metadata: { entitiesHash: newHash },
          },
          newHash
        );
        return { variables: newData, metadata: { entitiesHash: newHash } };
      }

      // If we have cached data and lastUpdate was provided, merge updates
      if (cachedData && params.lastUpdate) {
        ConstantVariablesApiClient.cache.update(
          cacheKey,
          { variables: newData },
          (cached, fresh) => {
            const mergedVariables = [...cached.variables];

            fresh.variables.forEach((newVariable: any) => {
              const existingIndex = mergedVariables.findIndex(
                (v) => v.id === newVariable.id
              );
              if (existingIndex >= 0) {
                // Update existing variable
                mergedVariables[existingIndex] = newVariable;
              } else {
                // Add new variable
                mergedVariables.push(newVariable);
              }
            });

            return {
              variables: mergedVariables,
            };
          },
          newHash
        );

        return ConstantVariablesApiClient.cache.get<FindAllConstantVariablesResponse>(
          cacheKey
        )!.data;
      }

      // First request or no cached data
      ConstantVariablesApiClient.cache.set(
        cacheKey,
        {
          variables: newData,
          metadata: { entitiesHash: newHash },
        },
        newHash
      );
      return {
        variables: newData,
        metadata: { entitiesHash: newHash },
      };
    } catch (error) {
      if (cachedData) {
        return cachedData.data;
      }
      throw this.handleError(error);
    }
  }

  // Get constant variable by ID with caching
  async findOne(id: string): Promise<FindOneConstantVariableResponse> {
    const cacheKey = `constant-variable:${id}`;
    const cachedData =
      ConstantVariablesApiClient.cache.get<FindOneConstantVariableResponse>(
        cacheKey
      );

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
      ConstantVariablesApiClient.cache.set(cacheKey, newData);
      return newData;
    } catch (error) {
      if (cachedData) {
        return cachedData.data;
      }
      throw this.handleError(error);
    }
  }

  // Get constant variable versions with caching
  async findOneVersions(
    id: string,
    page?: number,
    pageSize?: number
  ): Promise<FindAllConstantVariableVersionsResponse> {
    const cacheKey = `constant-variable:${id}:versions:${page}:${pageSize}`;
    const cachedData =
      ConstantVariablesApiClient.cache.get<FindAllConstantVariableVersionsResponse>(
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
        ConstantVariablesApiClient.cache.update(
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

        return ConstantVariablesApiClient.cache.get<FindAllConstantVariableVersionsResponse>(
          cacheKey
        )!.data;
      }

      ConstantVariablesApiClient.cache.set(cacheKey, newData);
      return newData;
    } catch (error) {
      if (cachedData) {
        return cachedData.data;
      }
      throw this.handleError(error);
    }
  }

  // Get specific constant variable version with caching
  async findOneVersion(
    id: string,
    version: string
  ): Promise<FindOneConstantVariableVersionResponse> {
    const cacheKey = `constant-variable:${id}:version:${version}`;
    const cachedData =
      ConstantVariablesApiClient.cache.get<FindOneConstantVariableVersionResponse>(
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
      ConstantVariablesApiClient.cache.set(cacheKey, newData);
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
      // Clear specific constant variable cache entries
      ConstantVariablesApiClient.cache.clear(`constant-variable:${id}`);
      ConstantVariablesApiClient.cache.clear(
        `constant-variable:${id}:versions`
      );
    } else {
      // Clear all constant variables cache
      ConstantVariablesApiClient.cache.clear();
    }
  }

  // Mutation methods (these should clear relevant cache entries)
  async create(
    data: CreateConstantVariableHttpDto
  ): Promise<CreateConstantVariableResponse> {
    try {
      const response = await this.client.post("/", data);
      this.clearCache(); // Clear all cache as the list has changed
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async copy(id: string): Promise<CopyConstantVariableResponse> {
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
    data: UpdateConstantVariableHttpDto
  ): Promise<UpdateConstantVariableResponse> {
    try {
      const response = await this.client.put(`/${id}`, data);
      this.clearCache(id); // Clear cache for this variable
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async remove(id: string): Promise<RemoveConstantVariableResponse> {
    try {
      const response = await this.client.delete(`/${id}`);
      this.clearCache(id); // Clear cache for this variable
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
