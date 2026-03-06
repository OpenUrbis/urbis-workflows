import React, { useCallback, useEffect, useMemo, useState } from "react";
import { getAccessToken } from "../../../auth/token";
import { ApiClient } from "../../../api";
import { GetAccessLogsResponse } from "../../../api/types/dashboard.dto";
import { StatCard } from "../components/StatCard";
import { BarChart } from "../components/BarChart";
import { DataTable } from "../components/DataTable";
import { Card } from "@open-urbis/map-ui";
import { Spinner } from "../../../components";
import { FaEye, FaListAlt, FaUser } from "react-icons/fa";
import { type DashboardFilters } from "../Dashboard";

export function AccessLogPanel({ filters }: { filters: DashboardFilters }) {
  const [data, setData] = useState<GetAccessLogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const rangeDays = useMemo(() => {
    if (!filters.dateFrom || !filters.dateTo) return null;
    const from = new Date(filters.dateFrom).getTime();
    const to = new Date(filters.dateTo).getTime();
    if (Number.isNaN(from) || Number.isNaN(to) || to < from) return null;
    return Math.ceil((to - from) / 86_400_000);
  }, [filters.dateFrom, filters.dateTo]);

  const formatBucketLabel = useCallback(
    (bucketStartDate: string): string => {
      if (!bucketStartDate || bucketStartDate.length < 10) return bucketStartDate;
      const d = new Date(bucketStartDate + "T00:00:00Z");
      if (Number.isNaN(d.getTime())) return bucketStartDate;
      const useMonth = rangeDays === null || rangeDays > 120;
      if (useMonth) {
        return d.toLocaleDateString("pt-BR", { month: "short", year: "numeric", timeZone: "UTC" });
      }
      return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" });
    },
    [rangeDays],
  );

  const formatTimestamp = useCallback((ts: string): string => {
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return ts;
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

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
      .getAccessLogs(params as any)
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total de Acessos" value={data.totalLogs} icon={FaEye} />
        <StatCard
          label="Workflows Acessados"
          value={data.distinctWorkflows}
          icon={FaListAlt}
          color="success"
        />
        <StatCard
          label="Usuários Ativos"
          value={data.distinctUsers}
          icon={FaUser}
          color="warning"
        />
      </div>

      <Card className="p-4 border border-border bg-card">
        <BarChart
          title={
            filters.dateFrom || filters.dateTo
              ? "Acessos no Período"
              : "Acessos ao Longo do Tempo"
          }
          items={data.accessOverTime.map((r) => ({
            label: formatBucketLabel(r.date),
            value: r.count,
            color: "bg-primary/80",
          }))}
        />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 border border-border bg-card">
          <DataTable
            title="Top Workflows Acessados"
            columns={[
              { header: "Workflow", accessor: "workflowLabel" },
              {
                header: "Acessos",
                accessor: (r) => r.count,
                className: "text-right tabular-nums",
              },
            ]}
            data={data.topWorkflows}
            emptyMessage="Nenhum acesso registrado"
          />
        </Card>

        <Card className="p-4 border border-border bg-card">
          <DataTable
            title="Top Usuários"
            columns={[
              { header: "Usuário", accessor: (r) => r.userName || r.userEmail },
              {
                header: "Acessos",
                accessor: (r) => r.count,
                className: "text-right tabular-nums",
              },
            ]}
            data={data.topUsers}
            emptyMessage="Nenhum acesso registrado"
          />
        </Card>
      </div>

      <Card className="p-4 border border-border bg-card">
        <DataTable
          title="Acessos Recentes"
          columns={[
            { header: "Workflow", accessor: "workflowLabel" },
            { header: "Usuário", accessor: (r) => r.userName || r.userEmail },
            {
              header: "Data",
              accessor: (r) => formatTimestamp(r.timestamp),
              className: "text-right tabular-nums whitespace-nowrap",
            },
          ]}
          data={data.recentLogs}
          emptyMessage="Nenhum acesso registrado"
        />
      </Card>
    </div>
  );
}
