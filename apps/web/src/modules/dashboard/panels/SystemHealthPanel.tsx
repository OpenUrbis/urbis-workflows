import React, { useEffect, useMemo, useState } from "react";
import { getAccessToken } from "../../../auth/token";
import { ApiClient } from "../../../api";
import { GetSystemHealthResponse } from "../../../api/types/dashboard.dto";
import { StatCard } from "../components/StatCard";
import { DataTable } from "../components/DataTable";
import { Badge, Card } from "@open-urbis/map-ui";
import { Spinner } from "../../../components";
import {
  FaExclamationTriangle,
  FaSearch,
  FaChartBar,
  FaClock,
} from "react-icons/fa";
import { type DashboardFilters } from "../Dashboard";

function formatDuration(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}min`;
  const hours = Math.round(ms / 3_600_000);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

export function SystemHealthPanel({ filters }: { filters: DashboardFilters }) {
  const [data, setData] = useState<GetSystemHealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQueue, setSelectedQueue] = useState<string>("");

  const filteredQueues = useMemo(() => {
    if (!data) return [];
    if (!selectedQueue) return data.deadLettersByQueue;
    return data.deadLettersByQueue.filter((r) => r.queueName === selectedQueue);
  }, [data, selectedQueue]);

  useEffect(() => {
    setLoading(true);
    const client = new ApiClient({
      baseURL: import.meta.env.VITE_BACK_END_API,
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    });
    const params: Record<string, string> = {};
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    client.dashboard
      .getSystemHealth(params as any)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [filters.dateFrom, filters.dateTo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="xl" />
      </div>
    );
  }
  if (error) return <div className="text-destructive text-sm py-4">Erro: {error}</div>;
  if (!data) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Dead Letters Total"
          value={data.totalDeadLetters}
          icon={FaExclamationTriangle}
          color={data.totalDeadLetters > 0 ? "destructive" : "success"}
        />
        <StatCard
          label="Não Reprocessadas"
          value={data.unprocessedDeadLetters}
          icon={FaExclamationTriangle}
          color={data.unprocessedDeadLetters > 0 ? "warning" : "success"}
        />
        <StatCard
          label="Mais Antiga (Não Reprocessada)"
          value={formatDuration(data.oldestUnprocessedDeadLetterMs)}
          icon={FaClock}
          color={data.oldestUnprocessedDeadLetterMs != null && data.oldestUnprocessedDeadLetterMs > 24 * 86_400_000 ? "destructive" : "muted"}
        />
        <StatCard
          label="Pedidos Não Indexados"
          value={data.unindexedWorkflows}
          icon={FaSearch}
          color={data.unindexedWorkflows > 0 ? "warning" : "success"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StatCard
          label="Stats Não Indexados"
          value={data.unindexedStats}
          icon={FaChartBar}
          color={data.unindexedStats > 0 ? "warning" : "success"}
        />

        {data.deadLettersByQueue.length > 0 && (
          <Card className="p-4 border border-border bg-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Filtro por Fila
              </h3>
              {selectedQueue ? (
                <button
                  type="button"
                  className="text-xs text-primary underline decoration-primary/30 hover:decoration-primary"
                  onClick={() => setSelectedQueue("")}
                >
                  Limpar
                </button>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {data.deadLettersByQueue.slice(0, 8).map((q) => (
                <button
                  key={q.queueName}
                  type="button"
                  className={`px-2 py-1 rounded-md text-xs border transition-colors ${
                    selectedQueue === q.queueName
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/40"
                  }`}
                  onClick={() => setSelectedQueue(q.queueName)}
                  title={q.queueName}
                >
                  {q.queueName}
                </button>
              ))}
            </div>
          </Card>
        )}
      </div>

      {filteredQueues.length > 0 && (
        <Card className="p-4 border border-border bg-card">
          <DataTable
            title="Dead Letters por Fila"
            columns={[
              {
                header: "Fila",
                accessor: (r) => (
                  <button
                    type="button"
                    className="text-left text-primary underline decoration-primary/30 hover:decoration-primary transition-colors"
                    onClick={() => setSelectedQueue(r.queueName)}
                  >
                    {r.queueName}
                  </button>
                ),
              },
              { header: "Total", accessor: (r) => r.total, className: "text-right tabular-nums" },
              { header: "Não Reprocessadas", accessor: (r) => r.unprocessed, className: "text-right tabular-nums" },
              {
                header: "Mais Antiga",
                accessor: (r) => {
                  const ms = r.oldestUnprocessedMs;
                  const isHot = ms != null && ms > 24 * 86_400_000;
                  return ms != null ? (
                    <Badge
                      variant={isHot ? "destructive" : "outline"}
                      className={isHot ? "text-xs" : "text-xs text-muted-foreground"}
                    >
                      {formatDuration(ms)}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  );
                },
                className: "text-right tabular-nums",
              },
            ]}
            data={filteredQueues}
          />
        </Card>
      )}
    </div>
  );
}
