import axios, { AxiosInstance } from "axios";
import { CacheService, CacheOptions } from "../services/cache.service";
import {
  SignUpHttpDto,
  UpdateProfileHttpDto,
  ConfirmSignUpHttpDto,
  SignInHttpDto,
  ForgetPasswordHttpDto,
  ConfirmForgetPasswordHttpDto,
  SetCustomUserFieldsHttpDto,
  CreateLinkHttpDto,
  UpdateLinkStatusHttpDto,
  DeleteLinkHttpDto,
  UserResponse,
  UserProfileResponse,
  SignInResponse,
  CustomFieldsResponse,
  RepresentativeLinksResponse,
  UserApiResponse,
} from "../types/users.dto";

export class UsersApiClient {
  private client: AxiosInstance;
  private static cache: CacheService;

  constructor(config: {
    baseURL: string;
    headers?: Record<string, string>;
    cacheOptions?: CacheOptions;
  }) {
    this.client = axios.create({
      baseURL: `${config.baseURL}/users`,
      headers: {
        "Content-Type": "application/json",
        ...config.headers,
      },
    });

    if (!UsersApiClient.cache) {
      UsersApiClient.cache = new CacheService({
        ...config.cacheOptions,
        storageKey: "users_cache",
      });
    }
  }

  private handleError(error: any): Error {
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    }
    return error;
  }

  async getProfile(): Promise<UserProfileResponse> {
    try {
      const response = await this.client.get<UserProfileResponse>("/profile");
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async signUp(data: SignUpHttpDto): Promise<UserResponse> {
    try {
      const response = await this.client.post<UserResponse>("/sign-up", data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async confirmSignUp(data: ConfirmSignUpHttpDto): Promise<void> {
    try {
      await this.client.post("/confirm-sign-up", data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async signIn(data: SignInHttpDto): Promise<SignInResponse> {
    try {
      const response = await this.client.post<SignInResponse>("/sign-in", data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async forgetPassword(data: ForgetPasswordHttpDto): Promise<void> {
    try {
      await this.client.post("/forget-password", data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async confirmForgetPassword(data: ConfirmForgetPasswordHttpDto): Promise<void> {
    try {
      await this.client.post("/confirm-forget-password", data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateProfile(data: UpdateProfileHttpDto): Promise<UserProfileResponse> {
    try {
      const response = await this.client.post<UserProfileResponse>("/update-profile", data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteAccount(): Promise<void> {
    try {
      await this.client.delete("/delete-account");
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getCustomUserFields(): Promise<CustomFieldsResponse> {
    try {
      const response = await this.client.get<CustomFieldsResponse>("/config");
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async setCustomUserFields(data: SetCustomUserFieldsHttpDto): Promise<CustomFieldsResponse> {
    try {
      const response = await this.client.post<CustomFieldsResponse>("/config", data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getRepresentativesLinks(): Promise<RepresentativeLinksResponse> {
    try {
      const response = await this.client.get<RepresentativeLinksResponse>("/representatives");
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getRepresentedLinks(): Promise<RepresentativeLinksResponse> {
    try {
      const response = await this.client.get<RepresentativeLinksResponse>("/represented");
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createLink(data: CreateLinkHttpDto): Promise<void> {
    try {
      await this.client.post("/link", data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateLinkStatus(data: UpdateLinkStatusHttpDto): Promise<void> {
    try {
      await this.client.put("/link", data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteLink(data: DeleteLinkHttpDto): Promise<void> {
    try {
      await this.client.delete("/link", { data });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getUserByDocument(document: string): Promise<UserApiResponse> {
    try {
      const response = await this.client.get<UserApiResponse>(`/api/user/${document}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getUserByDocumentUnmasked(document: string): Promise<UserApiResponse> {
    try {
      const response = await this.client.get<UserApiResponse>(`/api/user/${document}/unmasked`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
} 