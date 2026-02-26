import { UserData, Pagination } from "./common";
import { SchemaDefinition } from "./schema";
import { WorkflowStageEnum } from "./workflows-schema.dto";

export enum WorkflowUpdateTypeEnum {
  // Form events
  FORM_UPDATE = "FORM_UPDATE",
  // Signature events
  SIGNATURE_CREATED = "SIGNATURE_CREATED",
  SIGNATURE_SIGNED = "SIGNATURE_SIGNED",
  // Tax events
  TAX_PAYED = "TAX_PAYED",
  // Document events
  DOCUMENT_UPDATED = "DOCUMENT_UPDATED",
  // Workflow events
  WORKFLOW_UPDATED = "WORKFLOW_UPDATED",
}

export enum SignatureStateEnum {
  PENDING = 0,
  SIGNED = 1,
  REJECTED = -1,
}

export enum DocumentStateEnum {
  PENDING = 0,
  VALID = 1,
  UPDATED = 2,
  CANCELLED = -1,
  EXPIRED = -2,
  REVOKED = -3,
}

export enum TaxStateEnum {
  PENDING = 0,
  PAID = 1,
  OVERDUE = -1,
  CANCELLED = -2,
}

export enum ActivityStateEnum {
  CREATED = 0,
  IN_PROGRESS = 1,
  COMPLETED = 2,
  FAILED = -1,
  CANCELLED = -2,
}

// Base Types
export interface WorkflowMetadata {
  id: string;
  label: string;
  description: string;
  createdBy: UserData;
  createdAt: Date;
  updatedBy: UserData;
  updatedAt: Date;
}

export interface SignatureValue {
  id: string;
  state: ActivityStateEnum;
  createdAt: Date;
  updatedAt?: Date;
  createdBy: string;
  updatedBy?: string;
  signatures: Record<
    string,
    {
      id: string;
      signatureTypeId: string;
      documentId: string;
      label: string;
      form: any;
      state: SignatureStateEnum;
      createdAt: Date;
      updatedAt?: Date;
      createdBy: string;
      updatedBy?: string;
    }
  >;
  data?: {
    [key: string]: any;
  };
}

export interface DocumentValue {
  id: string;
  state: ActivityStateEnum;
  createdAt: Date;
  updatedAt?: Date;
  createdBy: string;
  updatedBy?: string;
  documents: Record<
    string,
    {
      id: string;
      label: string;
      url: string;
      checksum: string;
      state: DocumentStateEnum;
      createdAt: Date;
      updatedAt?: Date;
      createdBy: string;
      updatedBy?: string;
    }
  >;
  data?: {
    [key: string]: any;
  };
}

export interface TaxValue {
  id: string;
  state: ActivityStateEnum;
  createdAt: Date;
  updatedAt?: Date;
  createdBy: string;
  updatedBy?: string;
  taxes: Record<
    string,
    {
      id: string;
      label: string;
      url: string;
      amount: number;
      dueDate: string;
      state: TaxStateEnum;
      createdAt: Date;
      updatedAt?: Date;
      createdBy: string;
      updatedBy?: string;
    }
  >;
  data?: {
    [key: string]: any;
  };
}

export interface FormValue {
  id: string;
  state: ActivityStateEnum;
  createdAt: Date;
  updatedAt?: Date;
  createdBy: string;
  updatedBy?: string;
  form: any;
}

// Request DTOs
export interface CreateWorkflowHttpDto {
  workflowSchemaId: string;
  form: any;
  incoming?: any;
  stage: WorkflowStageEnum;
}

export interface SignWorkflowHttpDto {
  activityId: string;
  signatureTypeId: string;
  form: any;
}

export interface GenerateDocumentHttpDto {
  activityId: string;
  documentId: string;
}

export interface GenerateTaxHttpDto {
  activityId: string;
  taxId: string;
}

export interface FormWorkflowHttpDto {
  activityId: string;
  form: any;
}

// Search / Filter params for findAll
export interface FindAllWorkflowsParams {
  stage?: string;
  page?: number;
  pageSize?: number;
  query?: string;
  dateFrom?: string;
  dateTo?: string;
  label?: string;
  description?: string;
  createdByName?: string;
  workflowId?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

// Response DTOs
export interface CreateWorkflowResponse {
  id: string;
  activityId: string;
  label: string;
  description: string;
  createdBy: UserData;
  createdAt: Date;
  value: any;
  schema: SchemaDefinition;
}

export interface FindAllWorkflowsResponse {
  workflows: WorkflowMetadata[];
  pagination: Pagination;
}

export interface FindOneWorkflowResponse {
  id: string;
  label: string;
  description: string;
  stage: WorkflowStageEnum;
  createdBy: UserData;
  updatedBy: UserData;
  createdAt: Date;
  updatedAt: Date;
  value: any;
  schema: SchemaDefinition;
}

export interface SignWorkflowResponse {
  id: string;
  activityId: string;
  label: string;
  description: string;
  createdBy: UserData;
  createdAt: Date;
  updatedBy: UserData;
  updatedAt: Date;
  value: SignatureValue;
}

export interface GenerateDocumentResponse {
  document: string;
  fileName: string;
  content?: string;
}

export interface GenerateTaxResponse {
  document: string;
  fileName: string;
  content?: string;
  taxData?: Record<string, any>;
}

export interface FormWorkflowResponse {
  id: string;
  activityId: string;
  label: string;
  description: string;
  createdBy: UserData;
  createdAt: Date;
  updatedBy: UserData;
  updatedAt: Date;
  value: FormValue;
}
