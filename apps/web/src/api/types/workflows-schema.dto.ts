import { UserData, Pagination } from "./common";
import {
  ActivityTemplate,
  PluginConfig,
  CodeModule,
  ConstantVariable,
  Hook,
  SchemaDefinition,
  Incoming,
  Outgoing,
} from "./schema";

// Enums
export enum WorkflowStageEnum {
  DEVELOPMENT = "development",
  STAGING = "staging",
  PRODUCTION = "production",
}

// Request DTOs
export interface CreateWorkflowSchemaDto {
  label: string;
  description: string;
  commit: string;
  activities: ActivityTemplate[];
  plugins: PluginConfig[];
  code: CodeModule[];
  constants: ConstantVariable[];
  hooks?: Hook[];
  incoming: Incoming[];
  outgoing: Outgoing[];
  integrations?: Record<string, any>;
}

export interface UpdateWorkflowSchemaDto extends CreateWorkflowSchemaDto {}

export interface PublishWorkflowSchemaDto {
  stage: "staging" | "production";
  workflowVersionId: string;
}

export interface UnpublishWorkflowSchemaDto {
  stage: "staging" | "production";
}

// Response Types
export interface WorkflowSchema {
  id: string;
  label: string;
  description: string;
  stage: WorkflowStageEnum;
  createdBy: UserData;
  updatedBy?: UserData;
  createdAt: Date;
  updatedAt?: Date;
  schema: SchemaDefinition;
}

export interface WorkflowVersion {
  id: string;
  commit: string;
  createdBy: UserData;
  createdAt: Date;
}

export interface FindAllWorkflowsSchemaResponse {
  schemas: WorkflowSchema[];
  metadata: {
    entitiesHash?: string;
    processingTime?: number;
    notModified?: boolean;
  };
}

export interface WorkflowVersionResponse extends WorkflowSchema {
  versionId: string;
  commit: string;
}

export interface WorkflowVersionsResponse {
  versions: WorkflowVersion[];
  pagination: Pagination;
}

export interface PublishedWorkflowSchema extends WorkflowSchema {
  publishedTo: "staging" | "production";
}

export interface UnpublishedWorkflowSchema extends WorkflowSchema {
  unpublishedTo: "staging" | "production";
}

export interface DeletedWorkflowSchema {
  id: string;
  label: string;
  description: string;
  deleted: boolean;
  deletedBy: UserData;
  deletedAt: Date;
}
