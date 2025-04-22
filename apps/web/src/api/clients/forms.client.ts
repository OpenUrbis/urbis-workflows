import axios, { AxiosInstance } from "axios";
import { CacheService, CacheOptions } from "../services/cache.service";
import {
  FormMetadata,
  FormData,
  FormVersionMetadata,
  FormVersionData,
  CreateFormDto,
  UpdateFormDto,
} from "../types/form.dto";

interface PaginationResponse {
  page: number;
  pageSize: number;
  total: number;
}

interface FindAllFormsResponse {
  forms: FormMetadata[];
  metadata?: {
    entitiesHash: string;
  };
}

interface FindAllFormVersionsResponse {
  versions: FormVersionMetadata[];
  pagination: PaginationResponse;
}

export class FormsApiClient {
  private client: AxiosInstance;
  private static cache: CacheService;

  constructor(config: {
    baseURL: string;
    headers?: Record<string, string>;
    cacheOptions?: CacheOptions;
  }) {
    this.client = axios.create({
      baseURL: `${config.baseURL}/forms`,
      headers: {
        "Content-Type": "application/json",
        ...config.headers,
      },
    });

    if (!FormsApiClient.cache) {
      FormsApiClient.cache = new CacheService({
        ...config.cacheOptions,
        storageKey: "forms_cache",
      });
    }
  }

  async create(data: CreateFormDto): Promise<FormData> {
    try {
      const response = await this.client.post("/", data);
      this.clearCache();
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async copy(id: string): Promise<FormData> {
    try {
      const response = await this.client.post(`/${id}/copy`);
      this.clearCache();
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async findAll(): Promise<FindAllFormsResponse> {
    const cacheKey = `forms:all`;
    const cachedData = FormsApiClient.cache.get<FindAllFormsResponse>(cacheKey);
    const cachedHash = FormsApiClient.cache.getHash(cacheKey);

    try {
      const params: any = {
        lastUpdate: cachedData?.timestamp,
        entitiesHash: cachedHash,
      };

      const response = await this.client.get<FindAllFormsResponse>("/", {
        params,
      });

      if (!response.data && cachedData) {
        return cachedData.data;
      }

      const newData = response.data.forms;
      const newHash = response.data.metadata?.entitiesHash;

      if (cachedHash !== newHash) {
        FormsApiClient.cache.set(
          cacheKey,
          {
            forms: newData,
            metadata: { entitiesHash: newHash },
          },
          newHash
        );
        return { forms: newData, metadata: { entitiesHash: newHash! } };
      }

      if (cachedData && params.lastUpdate) {
        FormsApiClient.cache.update(
          cacheKey,
          { forms: newData },
          (cached, fresh) => {
            const mergedForms = [...cached.forms];

            fresh.forms.forEach((newForm: FormMetadata) => {
              const existingIndex = mergedForms.findIndex(
                (f) => f.id === newForm.id
              );
              if (existingIndex >= 0) {
                mergedForms[existingIndex] = newForm;
              } else {
                mergedForms.push(newForm);
              }
            });

            return {
              forms: mergedForms,
            };
          },
          newHash
        );

        return FormsApiClient.cache.get<FindAllFormsResponse>(cacheKey)!.data;
      }

      FormsApiClient.cache.set(
        cacheKey,
        {
          forms: newData,
          metadata: { entitiesHash: newHash },
        },
        newHash
      );
      return {
        forms: newData,
        metadata: { entitiesHash: newHash! },
      };
    } catch (error) {
      if (cachedData) {
        return cachedData.data;
      }
      throw this.handleError(error);
    }
  }

  async findOne(id: string): Promise<FormData> {
    const cacheKey = `form:${id}`;
    const cachedData = FormsApiClient.cache.get<FormData>(cacheKey);

    try {
      const params: any = {};
      if (cachedData) {
        params.lastUpdate = cachedData.timestamp;
      }

      const response = await this.client.get<FormData>(`/${id}`, { params });

      if (!response.data && cachedData) {
        return cachedData.data;
      }

      const newData = response.data;
      FormsApiClient.cache.set(cacheKey, newData);
      return newData;
    } catch (error) {
      if (cachedData) {
        return cachedData.data;
      }
      throw this.handleError(error);
    }
  }

  async findOneVersions(
    id: string,
    page?: number,
    pageSize?: number
  ): Promise<FindAllFormVersionsResponse> {
    const cacheKey = `form:${id}:versions:${page}:${pageSize}`;
    const cachedData =
      FormsApiClient.cache.get<FindAllFormVersionsResponse>(cacheKey);

    try {
      const params: any = { page, pageSize };
      if (cachedData) {
        params.lastUpdate = cachedData.timestamp;
      }

      const response = await this.client.get<FindAllFormVersionsResponse>(
        `/${id}/versions`,
        { params }
      );

      if (!response.data && cachedData) {
        return cachedData.data;
      }

      const newData = response.data;

      if (cachedData && params.lastUpdate) {
        FormsApiClient.cache.update(cacheKey, newData, (cached, fresh) => {
          const mergedVersions = [...cached.versions];

          fresh.versions.forEach((newVersion: FormVersionMetadata) => {
            const existingIndex = mergedVersions.findIndex(
              (v) => v.id === newVersion.id
            );
            if (existingIndex >= 0) {
              mergedVersions[existingIndex] = newVersion;
            } else {
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
        });

        return FormsApiClient.cache.get<FindAllFormVersionsResponse>(cacheKey)!
          .data;
      }

      FormsApiClient.cache.set(cacheKey, newData);
      return newData;
    } catch (error) {
      if (cachedData) {
        return cachedData.data;
      }
      throw this.handleError(error);
    }
  }

  async findOneVersion(id: string, version: string): Promise<FormVersionData> {
    const cacheKey = `form:${id}:version:${version}`;
    const cachedData = FormsApiClient.cache.get<FormVersionData>(cacheKey);

    try {
      const params: any = {};
      if (cachedData) {
        params.lastUpdate = cachedData.timestamp;
      }

      const response = await this.client.get<FormVersionData>(
        `/${id}/versions/${version}`,
        { params }
      );

      if (!response.data && cachedData) {
        return cachedData.data;
      }

      const newData = response.data;
      FormsApiClient.cache.set(cacheKey, newData);
      return newData;
    } catch (error) {
      if (cachedData) {
        return cachedData.data;
      }
      throw this.handleError(error);
    }
  }

  async update(id: string, data: UpdateFormDto): Promise<FormData> {
    try {
      const response = await this.client.put<FormData>(`/${id}`, data);
      this.clearCache(id);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    try {
      const response = await this.client.delete<{ deleted: boolean }>(`/${id}`);
      this.clearCache(id);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  clearCache(id?: string): void {
    if (id) {
      FormsApiClient.cache.clear(`form:${id}`);
      FormsApiClient.cache.clear(`form:${id}:versions`);
    } else {
      FormsApiClient.cache.clear();
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
