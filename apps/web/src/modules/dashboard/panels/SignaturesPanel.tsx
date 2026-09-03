import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAccessToken } from "../../../auth/token";
import { ApiClient } from "../../../api";
import { GetSignaturesResponse, DashboardSignatureStateCount } from "../../../api/types/dashboard.dto";
import { StatCard } from "../components/StatCard";
import { BarChart } from "../components/BarChart";
import { DataTable } from "../components/DataTable";
import { Badge, Card } from "@open-urbis/map-ui";
import { Spinner } from "../../../components";
import {
  FaPen,
  FaCheckCircle,
  FaTimesCircle,
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

export function SignaturesPanel({ filters }: { filters: DashboardFilters }) {
  const [data, setData] = useState<GetSignaturesResponse | null>(null);
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
    if (filters.stage && filters.stage !== "__all__") params.stage = filters.stage;
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    client.dashboard
      .getSignatures(params as any)
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
        <StatCard label="Total" value={data.totalSignatures} icon={FaPen} />
        <StatCard label="Pendentes" value={data.pendingCount} icon={FaClock} color="warning" />
        <StatCard label="Assinadas" value={data.signedCount} icon={FaCheckCircle} color="success" />
        <StatCard label="Rejeitadas" value={data.rejectedCount} icon={FaTimesCircle} color="destructive" />
        <StatCard
          label="Tempo Médio Resolução"
          value={formatDuration(data.avgResolutionTimeMs)}
          icon={FaHourglass}
          color="muted"
        />
      </div>

      <Card className="p-4 border border-border bg-card">
        <BarChart
          title="Assinaturas ao Longo do Tempo"
          items={(data.createdOverTime ?? []).map((r) => ({
            label: formatBucketLabel(r.date),
            value: r.count,
            color: "bg-primary/80",
          }))}
        />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 border border-border bg-card">
          <BarChart
            title="Por Estado"
            items={data.byState.map((r: DashboardSignatureStateCount) => ({
              label: r.state || "—",
              value: r.count,
              color:
                r.state.includes("Pendente")
                  ? "bg-amber-500"
                  : r.state.includes("Assinado")
                    ? "bg-emerald-500"
                    : "bg-red-500",
            }))}
          />
        </Card>

        <Card className="p-4 border border-border bg-card">
          <BarChart
            title="Pendentes por Tempo de Espera"
            items={data.pendingByAge.map((r) => ({
              label: r.bucket,
              value: r.count,
              color: "bg-amber-500/80",
            }))}
          />
        </Card>
      </div>

      {(data.byLabel ?? []).length > 0 && (
        <Card className="p-4 border border-border bg-card">
          <DataTable
            title="Por Tipo de Assinatura"
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
                header: "Assinadas",
                accessor: (r) =>
                  r.signed > 0 ? (
                    <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 bg-emerald-500/10 text-xs">
                      {r.signed}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">0</span>
                  ),
                className: "text-right",
              },
              {
                header: "Rejeitadas",
                accessor: (r) =>
                  r.rejected > 0 ? (
                    <Badge variant="outline" className="text-red-500 border-red-500/30 bg-red-500/10 text-xs">
                      {r.rejected}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">0</span>
                  ),
                className: "text-right",
              },
            ]}
            data={data.byLabel}
          />
        </Card>
      )}

      {(data.topPendingByWorkflow ?? []).length > 0 && (
        <Card className="p-4 border border-border bg-card">
          <DataTable
            title="Pedidos com Mais Assinaturas Pendentes"
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
            data={data.topPendingByWorkflow}
          />
        </Card>
      )}
    </div>
  );
}
