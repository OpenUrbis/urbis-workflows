// ── Query params ──

export interface DashboardTimeRangeQuery {
  stage?: "development" | "staging" | "production";
  dateFrom?: string;
  dateTo?: string;
}

// ── Workflow Operations Overview ──

export interface DashboardWorkflowStageCount {
  stage: string;
  count: number;
}

export interface DashboardWorkflowStatusCount {
  status: string;
  count: number;
}

export interface DashboardWorkflowBottleneck {
  activityNamespace: string;
  activityLabel: string;
  activityType: number;
  count: number;
  avgTimeMs: number | null;
}

export interface DashboardSchemaBottleneck {
  schemaId: string;
  schemaLabel: string;
  activities: DashboardWorkflowBottleneck[];
  completedCount: number;
}

export interface DashboardTimeSeriesPoint {
  date: string;
  count: number;
}

export interface GetWorkflowOverviewResponse {
  byStage: DashboardWorkflowStageCount[];
  byStatus: DashboardWorkflowStatusCount[];
  bottlenecks: DashboardSchemaBottleneck[];
  createdOverTime: DashboardTimeSeriesPoint[];
  totalWorkflows: number;
  completedWorkflows: number;
  inProgressWorkflows: number;
  avgCompletionTimeMs: number | null;
}

// ── Workflow Schema Management ──

export interface DashboardSchemaUsageRow {
  schemaId: string;
  schemaLabel: string;
  totalInstances: number;
  completedInstances: number;
  inProgressInstances: number;
  avgCompletionTimeMs: number | null;
}

export interface DashboardSchemaEnvironmentRow {
  schemaId: string;
  schemaLabel: string;
  hasDevelopment: boolean;
  hasStaging: boolean;
  hasProduction: boolean;
  deleted: boolean;
}

export interface GetSchemaManagementResponse {
  totalSchemas: number;
  activeSchemas: number;
  deletedSchemas: number;
  environments: DashboardSchemaEnvironmentRow[];
  usage: DashboardSchemaUsageRow[];
}

// ── Signatures Dashboard ──

export interface DashboardSignatureStateCount {
  state: string;
  count: number;
}

export interface DashboardSignatureAgingBucket {
  bucket: string;
  count: number;
}

export interface GetSignaturesResponse {
  byState: DashboardSignatureStateCount[];
  pendingByAge: DashboardSignatureAgingBucket[];
  totalSignatures: number;
  pendingCount: number;
  signedCount: number;
  rejectedCount: number;
}

// ── Tax & Documents Dashboard ──

export interface DashboardTaxStateCount {
  state: string;
  count: number;
}

export interface DashboardDocumentStateCount {
  state: string;
  count: number;
}

export interface GetTaxDocumentsResponse {
  taxByState: DashboardTaxStateCount[];
  totalTaxes: number;
  failedTaxes: number;
  documentByState: DashboardDocumentStateCount[];
  totalDocuments: number;
}

// ── Users & IAM Dashboard ──

export interface DashboardAccessLevelCount {
  accessLevel: number;
  label: string;
  count: number;
}

export interface DashboardUserTimeSeriesPoint {
  date: string;
  count: number;
}

export interface GetUsersIamResponse {
  totalUsers: number;
  byAccessLevel: DashboardAccessLevelCount[];
  registrationsOverTime: DashboardUserTimeSeriesPoint[];
  usersWithoutIamAccess: number;
}

// ── System Health / Dead Letters ──

export interface DashboardDeadLetterQueueCount {
  queueName: string;
  total: number;
  unprocessed: number;
}

export interface GetSystemHealthResponse {
  deadLettersByQueue: DashboardDeadLetterQueueCount[];
  totalDeadLetters: number;
  unprocessedDeadLetters: number;
  unindexedWorkflows: number;
  unindexedStats: number;
}

// ── Subscriptions & Events ──

export interface DashboardSubscriptionStatusCount {
  status: string;
  count: number;
}

export interface DashboardSubscriptionTypeCount {
  type: string;
  count: number;
}

export interface GetSubscriptionsResponse {
  byStatus: DashboardSubscriptionStatusCount[];
  byType: DashboardSubscriptionTypeCount[];
  totalSubscriptions: number;
  activeSubscriptions: number;
}

// ── Workflow Pipeline (Kanban) ──

export interface DashboardPipelineQueryParams {
  stage?: "development" | "staging" | "production";
  dateFrom?: string;
  dateTo?: string;
  schemaId?: string;
}

export interface DashboardPipelineColumn {
  namespace: string;
  label: string;
  type: number;
  count: number;
  avgDurationMs: number | null;
}

export interface DashboardPipelineSummary {
  totalWorkflows: number;
  completedWorkflows: number;
  inProgressWorkflows: number;
  avgCompletionTimeMs: number | null;
  oldestInProgressAgeMs: number | null;
  completionRate: number;
}

export interface DashboardPipelineSchema {
  schemaId: string;
  schemaLabel: string;
  columns: DashboardPipelineColumn[];
  summary: DashboardPipelineSummary;
}

export interface GetWorkflowPipelineResponse {
  schemas: DashboardPipelineSchema[];
}
