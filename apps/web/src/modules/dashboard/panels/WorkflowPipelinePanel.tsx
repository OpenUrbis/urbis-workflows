import React, { useEffect, useMemo, useState } from "react";
import { getAccessToken } from "../../../auth/token";
import { ApiClient } from "../../../api";
import {
  GetWorkflowPipelineResponse,
  DashboardPipelineSchema,
} from "../../../api/types/dashboard.dto";
import { StatCard } from "../components/StatCard";
import { Card, Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@open-urbis/map-ui";
import { Spinner } from "../../../components";
import { useNavigate } from "react-router-dom";
import {
  FaLayerGroup,
  FaCheckCircle,
  FaPercent,
  FaClock,
  FaFileAlt,
  FaPen,
  FaReceipt,
  FaFile,
  FaHourglassHalf,
} from "react-icons/fa";
import { type DashboardFilters } from "../Dashboard";

const ACTIVITY_TYPE_ICONS: Record<number, React.ElementType> = {
  0: FaFileAlt,
  1: FaPen,
  2: FaReceipt,
  3: FaFile,
};

const ACTIVITY_TYPE_LABELS: Record<number, string> = {
  0: "Formulário",
  1: "Assinatura",
  2: "Taxa",
  3: "Documento",
};

function formatDuration(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}min`;
  const hours = ms / 3_600_000;
  if (hours < 24) return `${Math.round(hours)}h`;
  const days = hours / 24;
  if (days < 30) return `${days.toFixed(1)}d`;
  return `${Math.round(days / 30)}m`;
}

function formatRate(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

function SchemaKanban({
  schema,
  stage,
}: {
  schema: DashboardPipelineSchema;
  stage: string;
}) {
  const navigate = useNavigate();
  const maxCount = useMemo(
    () => Math.max(...schema.columns.map((c) => c.count), 1),
    [schema.columns],
  );

  const buildUrl = (activityLabel: string) =>
    `/workflows/all?stage=${stage}&status=${encodeURIComponent(activityLabel)}`;

  const handleColumnClick = (
    e: React.MouseEvent<HTMLDivElement>,
    activityLabel: string,
  ) => {
    // Middle-click or ctrl/meta+click → new tab
    if (e.button === 1 || e.ctrlKey || e.metaKey) {
      window.open(buildUrl(activityLabel), "_blank");
      return;
    }
    navigate(buildUrl(activityLabel));
  };

  const handleColumnMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    activityLabel: string,
  ) => {
    // Capture middle-click (button === 1) so we can open in new tab
    if (e.button === 1) {
      e.preventDefault();
      window.open(buildUrl(activityLabel), "_blank");
    }
  };

  return (
    <Card className="border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground truncate">
          {schema.schemaLabel}
        </h3>
        <Badge variant="secondary" className="ml-2 shrink-0">
          {schema.summary.totalWorkflows} total
        </Badge>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 py-3 border-b border-border bg-muted/30">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
            Conclusão
          </span>
          <span className="text-sm font-semibold text-foreground tabular-nums">
            {formatRate(schema.summary.completionRate)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
            Concluídos
          </span>
          <span className="text-sm font-semibold text-emerald-600 tabular-nums">
            {schema.summary.completedWorkflows}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
            Tempo Médio
          </span>
          <span className="text-sm font-semibold text-foreground tabular-nums">
            {formatDuration(schema.summary.avgCompletionTimeMs)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
            Mais Antigo
          </span>
          <span className="text-sm font-semibold text-foreground tabular-nums">
            {formatDuration(schema.summary.oldestInProgressAgeMs)}
          </span>
        </div>
      </div>

      {/* Kanban columns */}
      <div className="flex overflow-x-auto">
        {schema.columns.map((col) => {
          const intensity = maxCount > 0 ? col.count / maxCount : 0;
          const Icon = ACTIVITY_TYPE_ICONS[col.type] || FaFileAlt;
          const typeLabel = ACTIVITY_TYPE_LABELS[col.type] || "Outro";

          return (
            <div
              key={col.namespace}
              role="button"
              tabIndex={0}
              onClick={(e) => handleColumnClick(e, col.label)}
              onMouseDown={(e) => handleColumnMouseDown(e, col.label)}
              onKeyDown={(e) => {
                if (e.key === "Enter") navigate(buildUrl(col.label));
              }}
              className="flex flex-col items-center flex-1 min-w-[120px] px-3 py-4 border-r last:border-r-0 border-border cursor-pointer hover:bg-muted/50 transition-colors"
              style={{
                backgroundColor:
                  intensity > 0
                    ? `rgba(239, 68, 68, ${Math.min(intensity * 0.15, 0.15)})`
                    : undefined,
              }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                  {typeLabel}
                </span>
              </div>
              <span className="text-xs font-medium text-foreground text-center mb-2 leading-tight">
                {col.label}
              </span>
              <span className="text-2xl font-bold text-foreground tabular-nums">
                {col.count}
              </span>
              {col.avgDurationMs !== null && (
                <span className="text-[10px] text-muted-foreground mt-1">
                  ~{formatDuration(col.avgDurationMs)} / etapa
                </span>
              )}
            </div>
          );
        })}

        {/* Completed column */}
        <div
          role="button"
          tabIndex={0}
          onClick={(e) => handleColumnClick(e, "Completo")}
          onMouseDown={(e) => handleColumnMouseDown(e, "Completo")}
          onKeyDown={(e) => {
            if (e.key === "Enter") navigate(buildUrl("Completo"));
          }}
          className="flex flex-col items-center flex-1 min-w-[120px] px-3 py-4 cursor-pointer hover:bg-muted/50 transition-colors bg-emerald-500/5"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <FaCheckCircle className="w-3 h-3 text-emerald-500" />
            <span className="text-[10px] uppercase tracking-wide text-emerald-600 font-medium">
              Concluído
            </span>
          </div>
          <span className="text-xs font-medium text-emerald-600 text-center mb-2 leading-tight">
            Completo
          </span>
          <span className="text-2xl font-bold text-emerald-600 tabular-nums">
            {schema.summary.completedWorkflows}
          </span>
        </div>
      </div>
    </Card>
  );
}

export function WorkflowPipelinePanel({ filters }: { filters: DashboardFilters }) {
  const [data, setData] = useState<GetWorkflowPipelineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSchema, setSelectedSchema] = useState<string>("__all__");

  const stage = filters.stage && filters.stage !== "__all__" ? filters.stage : "production";

  useEffect(() => {
    setLoading(true);
    setError(null);
    const client = new ApiClient({
      baseURL: import.meta.env.VITE_BACK_END_API,
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    });
    const params: Record<string, string> = { stage };
    if (selectedSchema !== "__all__") {
      params.schemaId = selectedSchema;
    }
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    client.dashboard
      .getWorkflowPipeline(params as any)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [stage, selectedSchema, filters]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="xl" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="text-destructive text-sm py-4">Erro: {error}</div>
    );
  }
  if (!data || data.schemas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground text-sm">
        Nenhum dado de pipeline disponível para este ambiente.
      </div>
    );
  }

  // Compute global summary across all displayed schemas
  const globalSummary = data.schemas.reduce(
    (acc, s) => ({
      total: acc.total + s.summary.totalWorkflows,
      completed: acc.completed + s.summary.completedWorkflows,
      inProgress: acc.inProgress + s.summary.inProgressWorkflows,
    }),
    { total: 0, completed: 0, inProgress: 0 },
  );

  // Schema options for the filter
  const schemaOptions = data.schemas.map((s) => ({
    value: s.schemaId,
    label: `${s.schemaLabel} (${s.summary.totalWorkflows})`,
  }));

  // Show top 3 by default (sorted by totalWorkflows desc), or all if filter active
  const displayedSchemas =
    selectedSchema !== "__all__"
      ? data.schemas
      : data.schemas.slice(0, 3);

  return (
    <div className="flex flex-col gap-6">
      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
            Assunto
          </label>
          <Select value={selectedSchema} onValueChange={setSelectedSchema}>
            <SelectTrigger className="h-8 w-64 text-xs">
              <SelectValue placeholder="Todos os assuntos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">
                Todos os assuntos
              </SelectItem>
              {schemaOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Global stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total de Workflows"
          value={globalSummary.total}
          icon={FaLayerGroup}
        />
        <StatCard
          label="Concluídos"
          value={globalSummary.completed}
          icon={FaCheckCircle}
          color="success"
        />
        <StatCard
          label="Em Andamento"
          value={globalSummary.inProgress}
          icon={FaHourglassHalf}
          color="warning"
        />
        <StatCard
          label="Taxa de Conclusão"
          value={
            globalSummary.total > 0
              ? formatRate(globalSummary.completed / globalSummary.total)
              : "—"
          }
          icon={FaPercent}
          color="muted"
        />
      </div>

      {/* Kanban boards */}
      <div className="flex flex-col gap-4">
        {displayedSchemas.map((schema) => (
          <SchemaKanban key={schema.schemaId} schema={schema} stage={stage} />
        ))}
      </div>

      {selectedSchema === "__all__" && data.schemas.length > 3 && (
        <p className="text-xs text-muted-foreground text-center">
          Mostrando os 3 assuntos com mais workflows. Use o filtro acima para ver outros.
        </p>
      )}
    </div>
  );
}
