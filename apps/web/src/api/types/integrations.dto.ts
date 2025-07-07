import { UserData, Pagination } from "./common";

// Request DTOs
export interface CreateSecretHttpDto {
  label: string;
  namespace: string;
  documentation: string;
  value: string;
  commit: string;
}

export interface UpdateSecretHttpDto extends CreateSecretHttpDto {}

export interface IntegrationRequestConfig {
  params?: Record<string, any>;
  headers?: Record<string, any>;
  timeout?: number;
  withCredentials?: boolean;
  responseType?:
    | "arraybuffer"
    | "blob"
    | "document"
    | "json"
    | "text"
    | "stream";
  auth?: {
    username: string;
    password: string;
  };
}

export interface IntegrationHttpDto {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";
  url: string;
  data?: any;
  config?: IntegrationRequestConfig;
}

// Response Types
export interface SecretMetadata {
  id: string;
  label: string;
  namespace: string;
  documentation: string;
  createdBy: UserData;
  updatedBy: UserData;
  createdAt: string;
  updatedAt: string;
  commit: string;
}

export interface SecretVersion {
  id: string;
  label: string;
  namespace: string;
  documentation: string;
  createdBy: UserData;
  createdAt: string;
  commit: string;
}

export interface CreateSecretResponse extends SecretMetadata {}

export interface FindOneSecretResponse {
  id: string;
  label: string;
  namespace: string;
  documentation: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  updatedBy: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  commit: string;
}

export interface FindOneDecryptedSecretResponse extends FindOneSecretResponse {
  value: string;
}

export interface FindAllSecretsResponse {
  secrets: SecretMetadata[];
  metadata: {
    entitiesHash: string;
  };
}

export interface FindAllSecretVersionsResponse {
  versions: SecretVersion[];
  pagination: Pagination;
}

export interface FindOneSecretVersionResponse extends SecretVersion {}

export interface UpdateSecretResponse extends SecretMetadata {}

export interface RemoveSecretResponse {
  id: string;
  label: string;
  namespace: string;
  documentation: string;
  deleted: boolean;
  deletedBy: UserData;
  deletedAt: Date;
}

export interface IntegrationCallResponse {
  statusCode: number;
  data: any;
  headers: Record<string, string>;
}
