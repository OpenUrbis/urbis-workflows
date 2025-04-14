import { UserData } from "./common";

export enum ConstantTypeEnum {
  STRING = 0,
  NUMBER = 1,
  BOOLEAN = 2,
  DATE = 3,
  OBJECT = 4,
  TABLE = 5,
}

// Request DTOs
export interface CreateConstantVariableHttpDto {
  label: string;
  namespace: string;
  documentation: string;
  type: ConstantTypeEnum;
  value: any;
  commit: string;
}

export interface UpdateConstantVariableHttpDto
  extends CreateConstantVariableHttpDto {}

// Response Types
export interface ConstantVariableMetadata {
  id: string;
  label: string;
  namespace: string;
  documentation: string;
  type: ConstantTypeEnum;
  createdBy: UserData;
  updatedBy: UserData;
  createdAt: Date;
  updatedAt: Date;
  commit: string;
}

export interface ConstantVariableVersion {
  id: string;
  label: string;
  namespace: string;
  documentation: string;
  type: ConstantTypeEnum;
  value: any;
  createdBy: UserData;
  createdAt: Date;
  commit: string;
}

export interface CreateConstantVariableResponse {
  id: string;
  label: string;
  namespace: string;
  documentation: string;
  type: ConstantTypeEnum;
  value: any;
  createdBy: UserData;
  createdAt: Date;
  commit: string;
}

export interface CopyConstantVariableResponse
  extends CreateConstantVariableResponse {}

export interface FindAllConstantVariablesResponse {
  variables: ConstantVariableMetadata[];
  metadata: {
    entitiesHash: string;
  };
}

export interface FindOneConstantVariableResponse
  extends ConstantVariableMetadata {
  value: any;
}

export interface FindAllConstantVariableVersionsResponse {
  versions: ConstantVariableVersion[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
  };
}

export interface FindOneConstantVariableVersionResponse
  extends ConstantVariableVersion {}

export interface UpdateConstantVariableResponse {
  id: string;
  label: string;
  namespace: string;
  documentation: string;
  type: ConstantTypeEnum;
  value: any;
  updatedBy: UserData;
  updatedAt: Date;
  commit: string;
}

export interface RemoveConstantVariableResponse {
  id: string;
  label: string;
  namespace: string;
  documentation: string;
  deleted: boolean;
  deletedBy: UserData;
  deletedAt: Date;
}
