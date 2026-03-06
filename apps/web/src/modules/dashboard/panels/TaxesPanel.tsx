import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAccessToken } from "../../../auth/token";
import { ApiClient } from "../../../api";
import { GetTaxDocumentsResponse, DashboardTaxStateCount } from "../../../api/types/dashboard.dto";
import { StatCard } from "../components/StatCard";
import { BarChart } from "../components/BarChart";
import { DataTable } from "../components/DataTable";
import { Badge, Card } from "@open-urbis/map-ui";
import { Spinner } from "../../../components";
import {
  FaReceipt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaClock,
  FaHourglass,
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

export function TaxesPanel({ filters }: { filters: DashboardFilters }) {
  const [data, setData] = useState<GetTaxDocumentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const rangeDays = useMemo(() => {
    if (!filters.dateFrom || !filters.dateTo) return null;
    const from = new Date(filters.dateFrom).getTime();
    const to = new Date(filters.dateTo).getTime();
    if (Number.isNaN(from) || Number.isNaN(to) || to < from) return null;
    return Math.ceil((to - from) / 86_400_000);
  }, [filters.dateFrom, filters.dateTo]);

  const formatBucketLabel = useCallback((bucketStartDate: string): string => {
    if (!bucketStartDate || bucketStartDate.length < 10) return bucketStartDate;
    const d = new Date(bucketStartDate + "T00:00:00Z");
    if (Number.isNaN(d.getTime())) return bucketStartDate;
    const useMonth = rangeDays === null || rangeDays > 120;
    if (useMonth) {
      return d.toLocaleDateString("pt-BR", { month: "short", year: "numeric", timeZone: "UTC" });
    }
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" });
  }, [rangeDays]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const client = new ApiClient({
      baseURL: import.meta.env.VITE_BACK_END_API,
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    });
    const params: Record<string, string> = {};
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    client.dashboard
      .getTaxDocuments(params as any)
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
  if (error) return <div className="text-destructive text-sm py-4">Erro: {error}</div>;
  if (!data) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total de Taxas" value={data.totalTaxes} icon={FaReceipt} />
        <StatCard label="Pendentes" value={data.pendingTaxes ?? 0} icon={FaClock} color="warning" />
        <StatCard label="Completas" value={data.completedTaxes ?? 0} icon={FaCheckCircle} color="success" />
        <StatCard label="Com Falha" value={data.failedTaxes} icon={FaExclamationTriangle} color="destructive" />
        <StatCard
          label="Tempo Médio Resolução"
          value={formatDuration(data.avgTaxResolutionTimeMs ?? null)}
          icon={FaHourglass}
          color="muted"
        />
      </div>

      <Card className="p-4 border border-border bg-card">
        <BarChart
          title="Taxas ao Longo do Tempo"
          items={(data.taxCreatedOverTime ?? []).map((r) => ({
            label: formatBucketLabel(r.date),
            value: r.count,
            color: "bg-primary/80",
          }))}
        />
      </Card>

      {data.taxByState.length > 0 && (
        <Card className="p-4 border border-border bg-card">
          <BarChart
            title="Taxas por Estado"
            items={data.taxByState.map((r: DashboardTaxStateCount) => ({
              label: r.state || "\u2014",
              value: r.count,
              color:
                r.state.includes("Completo")
                  ? "bg-emerald-500"
                  : r.state.includes("Falhou")
                    ? "bg-red-500"
                    : "bg-amber-500",
            }))}
          />
        </Card>
      )}

      {(data.taxByLabel ?? []).length > 0 && (
        <Card className="p-4 border border-border bg-card">
          <DataTable
            title="Por Tipo de Taxa"
            columns={[
              { header: "Tipo", accessor: "label" },
              { header: "Assunto", accessor: (r) => r.schemaLabel || "—", className: "text-muted-foreground" },
              { header: "Total", accessor: (r) => r.total, className: "text-right tabular-nums" },
              {
                header: "Pendentes",
                accessor: (r) =>
                  r.pending > 0 ? (
                    <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/10 text-xs">
                      {r.pending}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">0</span>
                  ),
                className: "text-right",
              },
              {
                header: "Completas",
                accessor: (r) =>
                  r.completed > 0 ? (
                    <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 bg-emerald-500/10 text-xs">
                      {r.completed}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">0</span>
                  ),
                className: "text-right",
              },
              {
                header: "Falhas",
                accessor: (r) =>
                  r.failed > 0 ? (
                    <Badge variant="outline" className="text-red-500 border-red-500/30 bg-red-500/10 text-xs">
                      {r.failed}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">0</span>
                  ),
                className: "text-right",
              },
            ]}
            data={data.taxByLabel}
          />
        </Card>
      )}

      {(data.topTaxPendingByWorkflow ?? []).length > 0 && (
        <Card className="p-4 border border-border bg-card">
          <DataTable
            title="Pedidos com Mais Taxas Pendentes"
            columns={[
              {
                header: "Pedido",
                accessor: (r) => (
                  <button
                    type="button"
                    className="text-left text-primary underline decoration-primary/30 hover:decoration-primary transition-colors"
                    onClick={() => navigate(`/workflows/${r.workflowId}`)}
                  >
                    {r.workflowLabel || r.workflowId}
                  </button>
                ),
              },
              { header: "Pendentes", accessor: (r) => r.pendingCount, className: "text-right tabular-nums font-medium" },
              {
                header: "Mais Antiga",
                accessor: (r) => {
                  const ms = r.oldestPendingMs;
                  const isHot = ms !== null && ms > 7 * 86_400_000;
                  return (
                    <span className={isHot ? "text-red-500 font-medium" : "text-muted-foreground"}>
                      {formatDuration(ms)}
                    </span>
                  );
                },
                className: "text-right tabular-nums",
              },
            ]}
            data={data.topTaxPendingByWorkflow}
          />
        </Card>
      )}
    </div>
  );
}
