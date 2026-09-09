import axios, { AxiosInstance } from "axios";
import { UserIamDetailsResponse } from "../types/iam.dto";
import { userIamStore } from "../services/user-iam-store";
import { getAccessToken } from "../../auth/token";

interface AuthenticatedAxiosConfig {
  baseURL: string;
  headers?: Record<string, string>;
}

/**
 * Create an API client whose Authorization header always uses the current OIDC
 * user. This is intentionally request-scoped so a silent renew is immediately
 * reflected by every API client, including instances created before the renew.
 */
export function createAuthenticatedAxios(
  config: AuthenticatedAxiosConfig,
): AxiosInstance {
  const { Authorization, authorization, ...staticHeaders } = config.headers || {};
  const client = axios.create({
    baseURL: config.baseURL,
    headers: {
      "Content-Type": "application/json",
      ...staticHeaders,
    },
  });

  client.interceptors.request.use((requestConfig) => {
    const token = getAccessToken();
    requestConfig.headers = requestConfig.headers ?? {};

    if (token) {
      requestConfig.headers.Authorization = `Bearer ${token}`;
    } else {
      delete requestConfig.headers.Authorization;
      delete requestConfig.headers.authorization;
    }

    return requestConfig;
  });

  return client;
}

export interface ApiClientConfig {
  baseURL: string;
  headers?: Record<string, string>;
  path?: string;
}

/**
 * Base API client that provides userIam access to all extending clients
 */
export abstract class BaseApiClient {
  protected client: AxiosInstance;
  protected userIam: UserIamDetailsResponse | null = null;
  private removeListener: (() => void) | null = null;

  constructor(config: ApiClientConfig) {
    this.client = createAuthenticatedAxios({
      baseURL: `${config.baseURL}${config.path ? "/" + config.path : ""}`,
      headers: config.headers,
    });

    // Get the initial userIam value from the store
    this.userIam = userIamStore.getUserIam();

    // Register a listener to be notified when userIam changes
    this.removeListener = userIamStore.addListener((newUserIam) => {
      this.userIam = newUserIam;
    });
  }

  /**
   * Cleanup method to be called when the client is no longer needed
   * This will remove the listener from the userIamStore
   */
  public disconnect(): void {
    if (this.removeListener) {
      this.removeListener();
      this.removeListener = null;
    }
  }

  /**
   * Helper method to handle API errors consistently
   */
  protected handleError(error: any): Error {
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
    return error instanceof Error ? error : new Error(String(error));
  }

  /**
   * Helper method to get the most recent timestamp between cached data and userIam
   *
   * @param cachedTimestamp The timestamp of the cached data
   * @returns The most recent timestamp
   */
  protected getMostRecentTimestamp(cachedTimestamp: string): string {
    if (this.userIam && this.userIam.updatedAt) {
      const cachedTime = new Date(cachedTimestamp).getTime();
      const userIamTime = new Date(this.userIam.updatedAt).getTime();

      return userIamTime > cachedTime
        ? this.userIam.updatedAt
        : cachedTimestamp;
    }

    return cachedTimestamp;
  }
}
