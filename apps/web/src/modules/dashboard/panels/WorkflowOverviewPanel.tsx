import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getAccessToken } from "../../../auth/token";
import { ApiClient } from "../../../api";
import { GetWorkflowOverviewResponse } from "../../../api/types/dashboard.dto";
import { StatCard } from "../components/StatCard";
import { BarChart } from "../components/BarChart";
import { type DashboardFilters } from "../Dashboard";
import { Card } from "@open-urbis/map-ui";
import { Spinner } from "../../../components";
import {
  FaLayerGroup,
  FaCheckCircle,
  FaSpinner,
  FaClock,
} from "react-icons/fa";

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
  const hours = Math.round(ms / 3_600_000);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

function formatStepAge(ms: number | null): string {
  return formatDuration(ms);
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfWeekUtc(d: Date): Date {
  // Match Postgres DATE_TRUNC('week', ...) which starts on Monday.
  const out = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = out.getUTCDay();
  const mondayBased = (day + 6) % 7; // Mon=0 ... Sun=6
  out.setUTCDate(out.getUTCDate() - mondayBased);
  return out;
}

function startOfMonthUtc(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

export function WorkflowOverviewPanel({ filters }: { filters: DashboardFilters }) {
  const [data, setData] = useState<GetWorkflowOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleActivityClick = useCallback(
    (activityLabel: string) => {
      const params = new URLSearchParams();
      if (filters.stage) params.set("stage", filters.stage);
      params.set("status", activityLabel);
      navigate(`/workflows/all?${params.toString()}`);
    },
    [filters.stage, navigate],
  );

  const rangeDays = React.useMemo(() => {
    if (!filters.dateFrom || !filters.dateTo) return null;
    const from = new Date(filters.dateFrom).getTime();
    const to = new Date(filters.dateTo).getTime();
    if (Number.isNaN(from) || Number.isNaN(to) || to < from) return null;
    return Math.ceil((to - from) / 86_400_000);
  }, [filters.dateFrom, filters.dateTo]);

  const formatBucketLabel = (bucketStartDate: string): string => {
    // bucketStartDate is expected as yyyy-mm-dd
    if (!bucketStartDate || bucketStartDate.length < 10) return bucketStartDate;
    const d = new Date(bucketStartDate + "T00:00:00Z");
    if (Number.isNaN(d.getTime())) return bucketStartDate;

    const useMonth = rangeDays !== null && rangeDays > 120;
    if (useMonth) {
      return d.toLocaleDateString("pt-BR", { month: "short", year: "numeric", timeZone: "UTC" });
    }
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" });
  };

  const createdSeries = React.useMemo(() => {
    if (!data) return [] as { date: string; count: number }[];

    const byDate = new Map<string, number>();
    for (const p of data.createdOverTime) {
      byDate.set(p.date.slice(0, 10), p.count);
    }

    const now = new Date();
    const hasExplicitRange = !!filters.dateFrom && !!filters.dateTo;
    const from = hasExplicitRange ? new Date(filters.dateFrom!) : new Date(now);
    const to = hasExplicitRange ? new Date(filters.dateTo!) : now;
    if (!hasExplicitRange) {
      from.setDate(from.getDate() - 30);
    }

    const bucket: "day" | "week" | "month" = (() => {
      if (rangeDays === null) return "week";
      if (rangeDays <= 7) return "day";
      if (rangeDays <= 120) return "week";
      return "month";
    })();

    const points: { date: string; count: number }[] = [];

    if (bucket === "day") {
      const cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
      const end = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()));
      while (cursor <= end) {
        const key = toIsoDate(cursor);
        points.push({ date: key, count: byDate.get(key) ?? 0 });
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
      return points;
    }

    if (bucket === "week") {
      let cursor = startOfWeekUtc(from);
      const end = startOfWeekUtc(to);
      while (cursor <= end) {
        const key = toIsoDate(cursor);
        points.push({ date: key, count: byDate.get(key) ?? 0 });
        cursor = new Date(cursor);
        cursor.setUTCDate(cursor.getUTCDate() + 7);
      }
      return points;
    }

    // month
    let cursor = startOfMonthUtc(from);
    const end = startOfMonthUtc(to);
    while (cursor <= end) {
      const key = toIsoDate(cursor);
      points.push({ date: key, count: byDate.get(key) ?? 0 });
      cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
    }
    return points;
  }, [data, filters.dateFrom, filters.dateTo, rangeDays]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const client = new ApiClient({
      baseURL: import.meta.env.VITE_BACK_END_API,
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    });
    const params: Record<string, string> = {};
    if (filters.stage && filters.stage !== "__all__") params.stage = filters.stage;
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    client.dashboard
      .getWorkflowOverview(params as any)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [filters]);

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
  if (!data) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total de Workflows"
          value={data.totalWorkflows}
          icon={FaLayerGroup}
        />
        <StatCard
          label="Concluídos"
          value={data.completedWorkflows}
          icon={FaCheckCircle}
          color="success"
        />
        <StatCard
          label="Em Andamento"
          value={data.inProgressWorkflows}
          icon={FaSpinner}
          color="warning"
        />
        <StatCard
          label="Tempo Médio"
          value={formatDuration(data.avgCompletionTimeMs)}
          icon={FaClock}
          color="muted"
        />
      </div>

      <Card className="p-4 border border-border bg-card">
        <BarChart
          title="Criados nos Últimos 30 Dias"
          items={createdSeries.map((r) => ({
            label: formatBucketLabel(r.date),
            value: r.count,
            color: "bg-primary/80",
          }))}
        />
      </Card>

      <Card className="p-4 border border-border bg-card">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Gargalos — Atividades com Mais Workflows Aguardando
        </h3>

        {data.bottlenecks.length === 0 ? (
          <div className="text-sm text-muted-foreground py-6 text-center">
            Nenhum gargalo encontrado para os filtros selecionados.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {data.bottlenecks.map((schema) => (
              <div key={schema.schemaId || schema.schemaLabel}>
                <h4 className="text-sm font-semibold text-foreground mb-2">
                  {schema.schemaLabel}
                </h4>
                <div className="border border-border rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left px-3 py-1.5 text-xs font-medium text-muted-foreground">Atividade</th>
                        <th className="text-left px-3 py-1.5 text-xs font-medium text-muted-foreground">Tipo</th>
                        <th className="text-right px-3 py-1.5 text-xs font-medium text-muted-foreground">Tempo médio</th>
                        <th className="text-right px-3 py-1.5 text-xs font-medium text-muted-foreground">Qtd</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schema.activities.map((act) => (
                        <tr
                          key={act.activityNamespace}
                          className="border-b border-border cursor-pointer hover:bg-muted/40 transition-colors"
                          onClick={() => handleActivityClick(act.activityLabel)}
                        >
                          <td className="px-3 py-1.5 text-foreground underline decoration-muted-foreground/30">{act.activityLabel}</td>
                          <td className="px-3 py-1.5 text-muted-foreground">
                            {ACTIVITY_TYPE_LABELS[act.activityType] ?? String(act.activityType)}
                          </td>
                          <td className="px-3 py-1.5 text-right tabular-nums text-muted-foreground">
                            {formatStepAge(act.avgTimeMs)}
                          </td>
                          <td className="px-3 py-1.5 text-right tabular-nums font-medium text-foreground">{act.count}</td>
                        </tr>
                      ))}
                      <tr className="bg-muted/20">
                        <td className="px-3 py-1.5 text-foreground font-semibold" colSpan={3}>Concluídos</td>
                        <td className="px-3 py-1.5 text-right tabular-nums font-semibold text-green-600">{schema.completedCount}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
