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
  stdTimeMs: number | null;
  medianTimeMs: number | null;
  oldestPendingMs: number | null;
}

export interface DashboardSchemaBottleneck {
  schemaId: string;
  schemaLabel: string;
  activities: DashboardWorkflowBottleneck[];
  completedCount: number;
  totalWorkflows: number;
  completionRate: number;
  avgCompletionTimeMs: number | null;
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

export interface DashboardSignatureTimeSeriesPoint {
  date: string;
  count: number;
}

export interface DashboardSignatureByLabelCount {
  label: string;
  schemaLabel: string;
  total: number;
  pending: number;
  signed: number;
  rejected: number;
}

export interface DashboardSignaturePendingByWorkflow {
  workflowId: string;
  workflowLabel: string;
  pendingCount: number;
  oldestPendingMs: number | null;
}

export interface GetSignaturesResponse {
  byState: DashboardSignatureStateCount[];
  pendingByAge: DashboardSignatureAgingBucket[];
  createdOverTime: DashboardSignatureTimeSeriesPoint[];
  byLabel: DashboardSignatureByLabelCount[];
  topPendingByWorkflow: DashboardSignaturePendingByWorkflow[];
  totalSignatures: number;
  pendingCount: number;
  signedCount: number;
  rejectedCount: number;
  avgResolutionTimeMs: number | null;
}

// ── Tax & Documents Dashboard ──

export interface DashboardTaxStateCount {
  state: string;
  count: number;
}

export interface DashboardTaxTimeSeriesPoint {
  date: string;
  count: number;
}

export interface DashboardTaxByLabelCount {
  label: string;
  schemaLabel: string;
  total: number;
  pending: number;
  completed: number;
  failed: number;
}

export interface DashboardTaxPendingByWorkflow {
  workflowId: string;
  workflowLabel: string;
  pendingCount: number;
  oldestPendingMs: number | null;
}

export interface DashboardDocumentStateCount {
  state: string;
  count: number;
}

export interface DashboardDocumentTimeSeriesPoint {
  date: string;
  count: number;
}

export interface DashboardDocumentByLabelCount {
  label: string;
  schemaLabel: string;
  total: number;
}

export interface DashboardDocumentByWorkflow {
  workflowId: string;
  workflowLabel: string;
  documentCount: number;
}

export interface GetTaxDocumentsResponse {
  taxByState: DashboardTaxStateCount[];
  taxCreatedOverTime: DashboardTaxTimeSeriesPoint[];
  taxByLabel: DashboardTaxByLabelCount[];
  topTaxPendingByWorkflow: DashboardTaxPendingByWorkflow[];
  totalTaxes: number;
  pendingTaxes: number;
  completedTaxes: number;
  failedTaxes: number;
  avgTaxResolutionTimeMs: number | null;
  documentByState: DashboardDocumentStateCount[];
  documentCreatedOverTime: DashboardDocumentTimeSeriesPoint[];
  documentByLabel: DashboardDocumentByLabelCount[];
  topDocumentsByWorkflow: DashboardDocumentByWorkflow[];
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
