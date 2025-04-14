import axios, { AxiosInstance } from "axios";
import {
  CreateWorkflowSchemaDto,
  UpdateWorkflowSchemaDto,
  PublishWorkflowSchemaDto,
  UnpublishWorkflowSchemaDto,
  WorkflowSchema,
  WorkflowVersionResponse,
  WorkflowVersionsResponse,
  PublishedWorkflowSchema,
  UnpublishedWorkflowSchema,
  DeletedWorkflowSchema,
  FindAllWorkflowsSchemaResponse,
} from "../types/workflows-schema.dto";
import { CacheService, CacheOptions } from "../services/cache.service";

export class WorkflowsSchemaApiClient {
  private client: AxiosInstance;
  private static cache: CacheService;

  constructor(config: {
    baseURL: string;
    headers?: Record<string, string>;
    cacheOptions?: CacheOptions;
  }) {
    this.client = axios.create({
      baseURL: `${config.baseURL}/workflows-schema`,
      headers: {
        "Content-Type": "application/json",
        ...config.headers,
      },
    });

    if (!WorkflowsSchemaApiClient.cache) {
      WorkflowsSchemaApiClient.cache = new CacheService({
        ...config.cacheOptions,
        storageKey: "workflows_schema_cache",
      });
    }
  }

  async findAll(stage?: string): Promise<WorkflowSchema[]> {
    const cacheKey = `workflows:${stage || "all"}`;
    const cachedData =
      WorkflowsSchemaApiClient.cache.get<WorkflowSchema[]>(cacheKey);
    const cachedHash = WorkflowsSchemaApiClient.cache.getHash(cacheKey);

    try {
      const params: any = {
        stage,
        lastUpdate: cachedData?.timestamp,
        entitiesHash: cachedHash,
      };

      const response = await this.client.get<FindAllWorkflowsSchemaResponse>(
        "/",
        {
          params,
        }
      );

      // If we get 304, use cached data
      if (
        response.data.metadata?.notModified === true &&
        cachedData &&
        cachedData.data
      ) {
        return cachedData.data;
      }

      const newData = response.data.schemas;
      const newHash = response.data.metadata.entitiesHash;

      // If hashes don't match, replace everything as we don't know what was deleted
      if (cachedHash !== newHash) {
        WorkflowsSchemaApiClient.cache.set(cacheKey, newData, newHash);
        return newData;
      }

      // If we have cached data and lastUpdate was provided, merge updates
      if (cachedData && params.lastUpdate) {
        WorkflowsSchemaApiClient.cache.update(
          cacheKey,
          newData,
          (cached, fresh) => {
            const mergedSchemas = [...cached];

            fresh.forEach((newSchema: WorkflowSchema) => {
              const existingIndex = mergedSchemas.findIndex(
                (s) => s.id === newSchema.id
              );
              if (existingIndex >= 0) {
                // Update existing schema
                mergedSchemas[existingIndex] = newSchema;
              } else {
                // Add new schema
                mergedSchemas.push(newSchema);
              }
            });

            return mergedSchemas;
          },
          newHash
        );

        return WorkflowsSchemaApiClient.cache.get<WorkflowSchema[]>(cacheKey)!
          .data;
      }

      // First request or no cached data
      WorkflowsSchemaApiClient.cache.set(cacheKey, newData, newHash);
      return newData;
    } catch (error) {
      if (cachedData) {
        return cachedData.data;
      }
      throw this.handleError(error);
    }
  }

  // Get workflow schema by ID with caching
  async findOne(id: string, stage?: string): Promise<WorkflowSchema> {
    const cacheKey = `workflow:${id}:${stage || "default"}`;
    const cachedData =
      WorkflowsSchemaApiClient.cache.get<WorkflowSchema>(cacheKey);

    try {
      const params: any = { stage };

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
      WorkflowsSchemaApiClient.cache.set(cacheKey, newData);
      return newData;
    } catch (error) {
      // If request fails and we have cached data, return it
      if (cachedData) {
        return cachedData.data;
      }
      throw this.handleError(error);
    }
  }

  // Get workflow versions with caching
  async findOneVersions(
    id: string,
    page?: number,
    pageSize?: number
  ): Promise<WorkflowVersionsResponse> {
    const cacheKey = `workflow:${id}:versions:${page}:${pageSize}`;
    const cachedData =
      WorkflowsSchemaApiClient.cache.get<WorkflowVersionsResponse>(cacheKey);

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
        WorkflowsSchemaApiClient.cache.update(
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
              pagination: fresh.pagination, // Use new pagination info
            };
          }
        );

        return WorkflowsSchemaApiClient.cache.get<WorkflowVersionsResponse>(
          cacheKey
        )!.data;
      }

      WorkflowsSchemaApiClient.cache.set(cacheKey, newData);
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
      // Clear specific workflow cache entries
      WorkflowsSchemaApiClient.cache.clear(`workflow:${id}`);
      WorkflowsSchemaApiClient.cache.clear(`workflow:${id}:versions`);
    } else {
      // Clear all workflows cache
      WorkflowsSchemaApiClient.cache.clear();
    }
  }

  // Mutation methods (these should clear relevant cache entries)
  async create(data: CreateWorkflowSchemaDto): Promise<WorkflowSchema> {
    try {
      const response = await this.client.post("/", data);
      this.clearCache(); // Clear all cache as the list has changed
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async update(
    id: string,
    data: UpdateWorkflowSchemaDto
  ): Promise<WorkflowSchema> {
    try {
      const response = await this.client.put(`/${id}`, data);
      this.clearCache(id); // Clear cache for this workflow
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Copy workflow schema
  async copy(id: string): Promise<WorkflowSchema> {
    try {
      const response = await this.client.post(`/${id}/copy`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get specific workflow version
  async findOneVersion(
    id: string,
    version: string
  ): Promise<WorkflowVersionResponse> {
    try {
      const response = await this.client.get(`/${id}/versions/${version}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Publish workflow schema
  async publish(
    id: string,
    data: PublishWorkflowSchemaDto
  ): Promise<PublishedWorkflowSchema> {
    try {
      const response = await this.client.patch(`/${id}/publish`, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Unpublish workflow schema
  async unpublish(
    id: string,
    data: UnpublishWorkflowSchemaDto
  ): Promise<UnpublishedWorkflowSchema> {
    try {
      const response = await this.client.patch(`/${id}/unpublish`, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Delete workflow schema
  async delete(id: string): Promise<DeletedWorkflowSchema> {
    try {
      const response = await this.client.delete(`/${id}`);
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
