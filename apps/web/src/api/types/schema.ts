import { IField, Permissions } from "@open-urbis/types";

// Enums
export enum ConstantTypeEnum {
  STRING = 0,
  NUMBER = 1,
  BOOLEAN = 2,
  DATE = 3,
  OBJECT = 4,
  TABLE = 5,
}

export enum ActivityTypeEnum {
  FORM = 0,
  SIGNATURE = 1,
  TAX = 2,
  DOCUMENT = 3,
  INCOMING = 4,
}

export enum PrivacyLevelEnum {
  PUBLIC = 0,
  REGISTERED = 1,
  RESTRICTED = 2,
  CONFIDENTIAL = 3,
  ANONYMIZED = 4,
}

export enum SensibilityLevelEnum {
  NOT_APPLICABLE = 0,
  PERSONAL = 1,
  SENSITIVE = 2,
  ANONYMIZED = 3,
}
// Base interfaces
export interface Incoming {
  id: string;
  label: string;
  documentation: string;
  namespace: string;
  form: IField;
  dependsOn: string;
}

export interface Outgoing {
  id: string;
  label: string;
  documentation: string;
  namespace: string;
  outgoingTo: string;
  dependsOn?: string[];
}

export interface CodeModule {
  id: string;
  label?: string;
  namespace?: string;
  code?: string;
  documentation?: string;
  sourceEntityId?: string | { id: string; version: string };
}

export interface Hook {
  id: string;
  topic?: string;
  cron?: string;
  datetime?: Date;
  callback: CodeModule;
  policy?: "DEFAULT";
}

export interface ConstantVariable {
  id: string;
  namespace?: string;
  type?: ConstantTypeEnum;
  label?: string;
  documentation?: string;
  value?: string;
  sourceEntityId?: string | { id: string; version: string };
}

export interface PluginConfig {
  id: string;
  label?: string;
  namespace?: string;
  config?: any; // TODO: Add PluginConfiguration interface
  documentation?: string;
  sourceEntityId?: string;
}

// Activity related interfaces
export interface SignatureConfig {
  id: string;
  label: string;
  documentation: string;
  namespace: string;
  form?: IField;
  sourceEntityId?: string;
}

export interface TaxConfig {
  id: string;
  label: string;
  documentation: string;
  namespace: string;
  taxCalculation: CodeModule;
  generateInvoiceCallback: Hook;
  checkPaymentCallback: Hook;
  billingDocumentTemplate?: string;
  sourceEntityId?: string;
}

export interface FormTemplate {
  form: IField;
}

/** Per-activity SEI sync override; falls back to schema integrations when not set */
export interface SeiIntegrationActivityConfig {
  IdSerie?: number;
}

export interface SignaturesTemplate {
  signatures: SignatureConfig[];
  seiIntegration?: SeiIntegrationActivityConfig;
}

export interface TaxTemplate {
  taxes: TaxConfig[];
  seiIntegration?: SeiIntegrationActivityConfig;
}

export type DocumentTemplateType = "document" | "plate" | "custom" | "certificate";

export interface LayerDescriptor {
  color: string;
  key: string;
  properties: {
    includeOnPopUp: boolean;
    key: string;
    label: string;
  }[];
  title: string;
}

export interface DocumentLayoutBlockMap {
  height?: string;
  layers: LayerDescriptor[];
  source: string;
  width?: string;
}

export interface DocumentLayout {
  logo: string;
  headerTitle: string;
  headerDescription: string;
  qrcode: string;
  title: string;
  description: string;
  blocks: {
    label: string;
    rows: {
      label: string;
      value: string;
    }[][];
    map?: DocumentLayoutBlockMap;
  }[];
}

export interface DocumentTemplateOptions {
  size?: "A4" | "custom";
  width?: string;
  height?: string;
  orientation?: "portrait" | "landscape";
  scale?: number;
  showPreview?: boolean;
  allowDownload?: boolean;
  allowPrint?: boolean;
  [key: string]: any;
}

export interface DocumentConfig {
  id: string;
  type: DocumentTemplateType;
  label: string;
  documentation: string;
  template?: string;
  layout?: DocumentLayout;
  options?: DocumentTemplateOptions;
}

export interface DocumentTemplate {
  documents: DocumentConfig[];
  seiIntegration?: SeiIntegrationActivityConfig;
}

export interface PrerequisiteWorkflowTemplate {
  availableWorkflows: {
    id: string;
    label: string;
    protocol: string;
    metadata: {
      [key: string]: string;
    };
    completedAt: string;
  }[];
}

export interface ActivityTemplate {
  id: string;
  type: ActivityTypeEnum;
  label: string;
  documentation: string;
  namespace: string;
  template:
    | FormTemplate
    | SignaturesTemplate
    | TaxTemplate
    | DocumentTemplate
    | PrerequisiteWorkflowTemplate;
  dependsOn?: string[];
  plugins?: PluginConfig[];
  hooks?: Hook[];
  accessLevel: PrivacyLevelEnum;
  permissions?: Permissions;
}

export interface Control {
  accessLevel: PrivacyLevelEnum;
  permissions?: Permissions;
}
// Main Schema Definition
export interface SchemaDefinition {
  activities: ActivityTemplate[];
  incoming: Incoming[];
  outgoing: Outgoing[];
  code: CodeModule[];
  constants: ConstantVariable[];
  hooks?: Hook[];
  plugins: PluginConfig[];
  control?: Control;
  integrations?: Record<string, any>;
}
