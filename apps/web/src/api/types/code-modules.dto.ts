import { UserData, Pagination } from "./common";

// Request DTOs
export interface CreateCodeModuleHttpDto {
  label: string;
  namespace: string;
  documentation: string;
  code: string;
  commit: string;
}

export interface CopyCodeModuleHttpDto extends CreateCodeModuleHttpDto {}

export interface UpdateCodeModuleHttpDto extends CreateCodeModuleHttpDto {}

// Response Types
export interface CodeModuleMetadata {
  id: string;
  label: string;
  namespace: string;
  documentation: string;
  code: string;
  createdBy: UserData;
  updatedBy: UserData;
  createdAt: Date;
  updatedAt: Date;
  commit: string;
}

export interface CodeModuleVersion {
  id: string;
  label: string;
  namespace: string;
  documentation: string;
  code: string;
  createdBy: UserData;
  createdAt: Date;
  commit: string;
}

export interface CreateCodeModuleResponse extends CodeModuleMetadata {}

export interface FindOneCodeModuleResponse extends CodeModuleMetadata {}

export interface FindAllCodeModulesResponse {
  modules: CodeModuleMetadata[];
  metadata: {
    entitiesHash: string;
  };
}

export interface FindAllCodeModuleVersionsResponse {
  versions: CodeModuleVersion[];
  pagination: Pagination;
}

export interface FindOneCodeModuleVersionResponse extends CodeModuleVersion {}

export interface UpdateCodeModuleResponse extends CodeModuleMetadata {}

export interface RemoveCodeModuleResponse {
  id: string;
  label: string;
  namespace: string;
  documentation: string;
  code: string;
  deleted: boolean;
  deletedBy: UserData;
  deletedAt: Date;
}
