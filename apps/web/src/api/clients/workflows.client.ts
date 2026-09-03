import {
  CreateWorkflowHttpDto,
  SignWorkflowHttpDto,
  CreateWorkflowResponse,
  FindAllWorkflowsResponse,
  FindAllWorkflowsParams,
  FindOneWorkflowResponse,
  SignWorkflowResponse,
  GenerateDocumentHttpDto,
  GenerateDocumentResponse,
  GenerateTaxHttpDto,
  GenerateTaxResponse,
  FormWorkflowHttpDto,
  FormWorkflowResponse,
} from "../types/workflows.dto";
import { CacheService, CacheOptions } from "../services/cache.service";
import { BaseApiClient, ApiClientConfig } from "./base-api.client";

export interface WorkflowsApiClientConfig extends ApiClientConfig {
  cacheOptions?: CacheOptions;
}

export class WorkflowsApiClient extends BaseApiClient {
  private static cache: CacheService;

  constructor(config: WorkflowsApiClientConfig) {
    super({
      ...config,
      path: "workflows",
    });

    // Initialize cache as a static instance if it doesn't exist
    if (!WorkflowsApiClient.cache) {
      WorkflowsApiClient.cache = new CacheService({
        ...config.cacheOptions,
        storageKey: "workflows_cache",
      });
    }
  }

  // Clear cache methods
  clearCache(id?: string): void {
    if (id) {
      // Clear specific workflow cache entry
      WorkflowsApiClient.cache.clear(`workflow:${id}`);
    } else {
      // Clear all workflows cache
      WorkflowsApiClient.cache.clear();
    }
  }

  /**
   * Create a new workflow
   * @param data Workflow creation data
   * @returns Created workflow response
   */
  async create(data: CreateWorkflowHttpDto): Promise<CreateWorkflowResponse> {
    try {
      const response = await this.client.post<CreateWorkflowResponse>("", data);
      this.clearCache(); // Clear all cache as the list has changed
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Find all workflows with pagination
   * @param stage The stage of workflows to fetch (development, staging, production)
   * @param page Page number (default: 1)
   * @param pageSize Number of items per page (default: 10)
   * @returns Paginated list of workflows
   */
  async findAll(
    stageOrParams: string | FindAllWorkflowsParams = "development",
    page: number = 1,
    pageSize: number = 10
  ): Promise<FindAllWorkflowsResponse> {
    try {
      // Support both legacy (stage, page, pageSize) and new params object signatures
      const params: FindAllWorkflowsParams =
        typeof stageOrParams === "string"
          ? { stage: stageOrParams, page, pageSize }
          : stageOrParams;

      // Strip undefined values so they don't get sent as "undefined" strings
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
      );

      const response = await this.client.get<FindAllWorkflowsResponse>("", {
        params: cleanParams,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Find all workflows across all users (admin endpoint)
   * Requires workflow:admin:findAll permission.
   */
  async findAllAdmin(
    params: FindAllWorkflowsParams = {},
  ): Promise<FindAllWorkflowsResponse> {
    try {
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
      );

      const response = await this.client.get<FindAllWorkflowsResponse>("/admin", {
        params: cleanParams,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Find a workflow by ID
   * @param id Workflow ID
   * @returns Workflow details
   */
  async findOne(id: string): Promise<FindOneWorkflowResponse> {
    const cacheKey = `workflow:${id}`;
    const cachedData =
      WorkflowsApiClient.cache.get<FindOneWorkflowResponse>(cacheKey);

    try {
      const params: any = {};

      // Add lastUpdate if we have cached data
      if (cachedData) {
        // Use our helper method to get the most recent timestamp
        // params.lastUpdate = this.getMostRecentTimestamp(
          // cachedData.timestamp.toString()
        // );
      }

      const response = await this.client.get<FindOneWorkflowResponse>(
        `/${id}`,
        { params }
      );

      // If we get empty response or not modified, use cached data
      if (!response.data && cachedData) {
        return cachedData.data;
      }

      // If we have new data, update cache and return
      const newData = response.data;
      WorkflowsApiClient.cache.set(cacheKey, newData);
      return newData;
    } catch (error) {
      if (cachedData) {
        return cachedData.data;
      }
      throw this.handleError(error);
    }
  }

  /**
   * @deprecated To be removed in the future to others microservices to use a auth middleware
   *
   * Find a workflow by ID
   * @param id Workflow ID
   * @returns Workflow details
   */
  async findOneApi(id: string): Promise<FindOneWorkflowResponse> {
    const response = await this.client.get<FindOneWorkflowResponse>(
      `/${id}/api`
    );
    return response.data;
  }

  /**
   * Sign a workflow
   * @param id Workflow ID
   * @param data Signature data
   * @returns Updated workflow with signature
   */
  async sign(
    id: string,
    data: SignWorkflowHttpDto
  ): Promise<SignWorkflowResponse> {
    try {
      const response = await this.client.patch<SignWorkflowResponse>(
        `/${id}/sign`,
        data
      );
      this.clearCache(id);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Generate a tax document for a workflow
   *
   * @param id Workflow ID
   * @param data Tax document generation data
   * @returns Generated tax document information
   */
  async generateTax(
    id: string,
    data: GenerateTaxHttpDto
  ): Promise<GenerateTaxResponse> {
    try {
      const response = await this.client.patch<GenerateTaxResponse>(
        `/${id}/tax`,
        data
      );
      this.clearCache(id);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Generate a document for a workflow
   * @param id Workflow ID
   * @param data Document generation data
   * @returns Generated document information
   */
  async generateDocument(
    id: string,
    data: GenerateDocumentHttpDto
  ): Promise<GenerateDocumentResponse> {
    try {
      const response = await this.client.patch<GenerateDocumentResponse>(
        `/${id}/document`,
        data
      );
      this.clearCache(id);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Fetch available field labels for structured query autocomplete.
   * @param search Optional search term to filter labels
   * @returns Array of field label descriptors
   */
  async getFieldLabels(
    search?: string,
  ): Promise<{ key: string; label: string; type: "text" | "number" }[]> {
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      const response = await this.client.get<{ key: string; label: string; type: "text" | "number" }[]>(
        "/field-labels",
        { params },
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async form(
    id: string,
    data: FormWorkflowHttpDto
  ): Promise<FormWorkflowResponse> {
    try {
      const response = await this.client.patch<FormWorkflowResponse>(
        `/${id}/form`,
        data
      );
      this.clearCache(id);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
