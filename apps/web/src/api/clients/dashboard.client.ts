import axios, { AxiosInstance } from "axios";
import {
  DashboardTimeRangeQuery,
  GetWorkflowOverviewResponse,
  GetSchemaManagementResponse,
  GetSignaturesResponse,
  GetTaxDocumentsResponse,
  GetUsersIamResponse,
  GetSystemHealthResponse,
  GetSubscriptionsResponse,
  GetAccessLogsResponse,
} from "../types/dashboard.dto";

export class DashboardApiClient {
  private client: AxiosInstance;

  constructor(config: {
    baseURL: string;
    headers?: Record<string, string>;
  }) {
    this.client = axios.create({
      baseURL: `${config.baseURL}/dashboard`,
      headers: {
        "Content-Type": "application/json",
        ...config.headers,
      },
    });
  }

  private handleError(error: any): Error {
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    }
    return error;
  }

  async getWorkflowOverview(
    params?: DashboardTimeRangeQuery,
  ): Promise<GetWorkflowOverviewResponse> {
    try {
      const response = await this.client.get<GetWorkflowOverviewResponse>(
        "/workflows/overview",
        { params },
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getSchemaManagement(): Promise<GetSchemaManagementResponse> {
    try {
      const response =
        await this.client.get<GetSchemaManagementResponse>("/schemas/management");
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getSignatures(
    params?: DashboardTimeRangeQuery,
  ): Promise<GetSignaturesResponse> {
    try {
      const response = await this.client.get<GetSignaturesResponse>(
        "/signatures",
        { params },
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getTaxDocuments(
    params?: DashboardTimeRangeQuery,
  ): Promise<GetTaxDocumentsResponse> {
    try {
      const response = await this.client.get<GetTaxDocumentsResponse>(
        "/tax-documents",
        { params },
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getUsersIam(): Promise<GetUsersIamResponse> {
    try {
      const response =
        await this.client.get<GetUsersIamResponse>("/users-iam");
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getUsersIamWithRange(
    params?: DashboardTimeRangeQuery,
  ): Promise<GetUsersIamResponse> {
    try {
      const response = await this.client.get<GetUsersIamResponse>("/users-iam", { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getSystemHealth(params?: DashboardTimeRangeQuery): Promise<GetSystemHealthResponse> {
    try {
      const response =
        await this.client.get<GetSystemHealthResponse>("/system-health", { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getSubscriptions(params?: DashboardTimeRangeQuery): Promise<GetSubscriptionsResponse> {
    try {
      const response =
        await this.client.get<GetSubscriptionsResponse>("/subscriptions", { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getAccessLogs(params?: DashboardTimeRangeQuery): Promise<GetAccessLogsResponse> {
    try {
      const response =
        await this.client.get<GetAccessLogsResponse>("/access-logs", { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
