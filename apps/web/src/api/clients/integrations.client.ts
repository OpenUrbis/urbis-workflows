import axios, { AxiosInstance } from "axios";
import {
  CreateSecretHttpDto,
  UpdateSecretHttpDto,
  IntegrationHttpDto,
  CreateSecretResponse,
  FindAllSecretsResponse,
  FindOneSecretResponse,
  UpdateSecretResponse,
  RemoveSecretResponse,
  IntegrationCallResponse,
  FindAllSecretVersionsResponse,
  FindOneSecretVersionResponse,
  FindOneDecryptedSecretResponse,
} from "../types/integrations.dto";
import { CacheService, CacheOptions } from "../services/cache.service";
import { createAuthenticatedAxios } from "./base-api.client";

export class IntegrationsApiClient {
  private client: AxiosInstance;
  private static cache: CacheService;

  constructor(config: {
    baseURL: string;
    headers?: Record<string, string>;
    cacheOptions?: CacheOptions;
  }) {
    this.client = createAuthenticatedAxios({
      baseURL: `${config.baseURL}/integrations`,
      headers: config.headers,
    });

    // Initialize cache as a static instance if it doesn't exist
    if (!IntegrationsApiClient.cache) {
      IntegrationsApiClient.cache = new CacheService({
        ...config.cacheOptions,
        storageKey: "integration_cache",
      });
    }
  }

  // Get all secrets with caching
  async findAllSecrets(): Promise<FindAllSecretsResponse> {
    const cacheKey = `secrets:all`;
    const cachedData =
      IntegrationsApiClient.cache.get<FindAllSecretsResponse>(cacheKey);
    const cachedHash = IntegrationsApiClient.cache.getHash(cacheKey);

    try {
      const params: any = {
        lastUpdate: cachedData?.timestamp,
        entitiesHash: cachedHash,
      };

      const response = await this.client.get<FindAllSecretsResponse>(
        "/secrets",
        {
          params,
        }
      );

      // If we get 304, use cached data
      if (!response.data && cachedData) {
        return cachedData.data;
      }

      const newData = response.data.secrets;
      const newHash = response.data.metadata.entitiesHash;

      // If hashes don't match, replace everything as we don't know what was deleted
      if (cachedHash !== newHash) {
        IntegrationsApiClient.cache.set(
          cacheKey,
          {
            secrets: newData,
            metadata: { entitiesHash: newHash },
          },
          newHash
        );
        return { secrets: newData, metadata: { entitiesHash: newHash } };
      }

      // If we have cached data and lastUpdate was provided, merge updates
      if (cachedData && params.lastUpdate) {
        IntegrationsApiClient.cache.update(
          cacheKey,
          { secrets: newData },
          (cached, fresh) => {
            const mergedSecrets = [...cached.secrets];

            fresh.secrets.forEach((newSecret: any) => {
              const existingIndex = mergedSecrets.findIndex(
                (s) => s.id === newSecret.id
              );
              if (existingIndex >= 0) {
                // Update existing secret
                mergedSecrets[existingIndex] = newSecret;
              } else {
                // Add new secret
                mergedSecrets.push(newSecret);
              }
            });

            return {
              secrets: mergedSecrets,
            };
          },
          newHash
        );

        return IntegrationsApiClient.cache.get<FindAllSecretsResponse>(
          cacheKey
        )!.data;
      }

      // First request or no cached data
      IntegrationsApiClient.cache.set(
        cacheKey,
        {
          secrets: newData,
          metadata: { entitiesHash: newHash },
        },
        newHash
      );
      return {
        secrets: newData,
        metadata: { entitiesHash: newHash },
      };
    } catch (error) {
      if (cachedData) {
        return cachedData.data;
      }
      throw this.handleError(error);
    }
  }

  // Get secret by ID with caching
  async findOneSecret(id: string): Promise<FindOneSecretResponse> {
    const cacheKey = `secret:${id}`;
    const cachedData =
      IntegrationsApiClient.cache.get<FindOneSecretResponse>(cacheKey);

    try {
      const params: any = {};

      // Add lastUpdate if we have cached data
      if (cachedData) {
        params.lastUpdate = cachedData.timestamp;
      }

      const response = await this.client.get(`/secrets/${id}`, { params });

      // If we get 304, use cached data
      if (response.data === "" && cachedData) {
        return cachedData.data;
      }

      // If we have new data, update cache and return
      const newData = response.data;
      IntegrationsApiClient.cache.set(cacheKey, newData);
      return newData;
    } catch (error) {
      if (cachedData) {
        return cachedData.data;
      }
      throw this.handleError(error);
    }
  }

  // Get secret versions with caching
  async findOneSecretVersions(
    id: string,
    page?: number,
    pageSize?: number
  ): Promise<FindAllSecretVersionsResponse> {
    const cacheKey = `secret:${id}:versions:${page}:${pageSize}`;
    const cachedData =
      IntegrationsApiClient.cache.get<FindAllSecretVersionsResponse>(cacheKey);

    try {
      const params: any = { page, pageSize };

      if (cachedData) {
        params.lastUpdate = cachedData.timestamp;
      }

      const response = await this.client.get(`/secrets/${id}/versions`, {
        params,
      });

      if (response.data === "" && cachedData) {
        return cachedData.data;
      }

      const newData = response.data;

      if (cachedData && params.lastUpdate) {
        // Merge strategy: Update versions while maintaining pagination
        IntegrationsApiClient.cache.update(
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

        return IntegrationsApiClient.cache.get<FindAllSecretVersionsResponse>(
          cacheKey
        )!.data;
      }

      IntegrationsApiClient.cache.set(cacheKey, newData);
      return newData;
    } catch (error) {
      if (cachedData) {
        return cachedData.data;
      }
      throw this.handleError(error);
    }
  }

  // Get specific secret version with caching
  async findOneSecretVersion(
    id: string,
    version: string
  ): Promise<FindOneSecretVersionResponse> {
    const cacheKey = `secret:${id}:version:${version}`;
    const cachedData =
      IntegrationsApiClient.cache.get<FindOneSecretVersionResponse>(cacheKey);

    try {
      const params: any = {};

      if (cachedData) {
        params.lastUpdate = cachedData.timestamp;
      }

      const response = await this.client.get(
        `/secrets/${id}/versions/${version}`,
        { params }
      );

      if (response.data === "" && cachedData) {
        return cachedData.data;
      }

      const newData = response.data;
      IntegrationsApiClient.cache.set(cacheKey, newData);
      return newData;
    } catch (error) {
      if (cachedData) {
        return cachedData.data;
      }
      throw this.handleError(error);
    }
  }

  // Get decrypted secret by ID with caching
  async findOneDecryptedSecret(
    id: string
  ): Promise<FindOneDecryptedSecretResponse> {
    const cacheKey = `secret:${id}:decrypted`;
    const cachedData =
      IntegrationsApiClient.cache.get<FindOneDecryptedSecretResponse>(cacheKey);

    try {
      const params: any = {};

      // Add lastUpdate if we have cached data
      if (cachedData) {
        params.lastUpdate = cachedData.timestamp;
      }

      const response = await this.client.get(`/secrets/${id}/decrypted`, {
        params,
      });

      // If we get 304, use cached data
      if (response.data === "" && cachedData) {
        return cachedData.data;
      }

      // If we have new data, update cache and return
      const newData = response.data;
      IntegrationsApiClient.cache.set(cacheKey, newData);
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
      // Clear specific secret cache entries
      IntegrationsApiClient.cache.clear(`secret:${id}`);
      IntegrationsApiClient.cache.clear(`secret:${id}:versions`);
    } else {
      // Clear all secrets cache
      IntegrationsApiClient.cache.clear();
    }
  }

  // Mutation methods (these should clear relevant cache entries)
  async createSecret(data: CreateSecretHttpDto): Promise<CreateSecretResponse> {
    try {
      const response = await this.client.post("/secrets", data);
      this.clearCache(); // Clear all cache as the list has changed
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateSecret(
    id: string,
    data: UpdateSecretHttpDto
  ): Promise<UpdateSecretResponse> {
    try {
      const response = await this.client.put(`/secrets/${id}`, data);
      this.clearCache(id); // Clear cache for this secret
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async removeSecret(id: string): Promise<RemoveSecretResponse> {
    try {
      const response = await this.client.delete(`/secrets/${id}`);
      this.clearCache(id); // Clear cache for this secret
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Integration call method (no caching needed as it's a direct API call)
  async call(data: IntegrationHttpDto): Promise<IntegrationCallResponse> {
    try {
      const response = await this.client.post("/call", data);
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
