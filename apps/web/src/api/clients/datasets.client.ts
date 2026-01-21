import axios, { AxiosInstance } from "axios";
import { CacheService, CacheOptions } from "../services/cache.service";
import {
  CreateDatasetHttpDto,
  UpdateDatasetHttpDto,
  CreateTableHttpDto,
  GenerateDownloadUrlHttpDto,
  GeneratePresignedUrlHttpDto,
  QueryTableHttpDto,
  CreateTableHttpResponse,
  GenerateDownloadUrlResponse,
  QueryTableResponse,
  GeneratePresignedUrlResponse,
  FindOneResponse,
  DatasetsEntity,
} from "../types/datasets.dto";

export class DatasetsApiClient {
  private client: AxiosInstance;
  private static cache: CacheService;

  constructor(config: {
    baseURL: string;
    headers?: Record<string, string>;
    cacheOptions?: CacheOptions;
  }) {
    this.client = axios.create({
      baseURL: `${config.baseURL}/datasets`,
      headers: {
        "Content-Type": "application/json",
        ...config.headers,
      },
    });

    if (!DatasetsApiClient.cache) {
      DatasetsApiClient.cache = new CacheService({
        ...config.cacheOptions,
        storageKey: "datasets_cache",
      });
    }
  }

  private handleError(error: any): Error {
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    }
    return error;
  }

  async findAll(): Promise<DatasetsEntity[]> {
    try {
      const response = await this.client.get<DatasetsEntity[]>("/");
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async findOne(id: string): Promise<FindOneResponse> {
    try {
      const response = await this.client.get<FindOneResponse>(`/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async create(data: CreateDatasetHttpDto): Promise<FindOneResponse> {
    try {
      const response = await this.client.post<FindOneResponse>("/", data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async update(
    id: string,
    data: UpdateDatasetHttpDto
  ): Promise<FindOneResponse> {
    try {
      const response = await this.client.put<FindOneResponse>(`/${id}`, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async remove(id: string): Promise<FindOneResponse> {
    try {
      const response = await this.client.delete<FindOneResponse>(`/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async generatePresignedUrl(
    data: GeneratePresignedUrlHttpDto
  ): Promise<GeneratePresignedUrlResponse> {
    try {
      const response = await this.client.post<GeneratePresignedUrlResponse>(
        "/generate-presigned-url",
        data
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async generateDownloadUrl(
    data: GenerateDownloadUrlHttpDto
  ): Promise<GenerateDownloadUrlResponse> {
    try {
      const response = await this.client.post<GenerateDownloadUrlResponse>(
        "/generate-download-url",
        data
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createTable(
    data: CreateTableHttpDto
  ): Promise<CreateTableHttpResponse> {
    try {
      const response = await this.client.post<CreateTableHttpResponse>(
        "/create-table",
        data
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async queryTable(data: QueryTableHttpDto): Promise<QueryTableResponse> {
    try {
      const response = await this.client.post<QueryTableResponse>(
        "/query-table",
        data
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
