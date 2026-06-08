import React, { useCallback, useEffect, useMemo, useState } from "react";
import { getAccessToken } from "../../../auth/token";
import { ApiClient } from "../../../api";
import { GetSubscriptionsResponse, DashboardSubscriptionStatusCount, DashboardSubscriptionTypeCount } from "../../../api/types/dashboard.dto";
import { StatCard } from "../components/StatCard";
import { BarChart } from "../components/BarChart";
import { Card } from "@open-urbis/map-ui";
import { Spinner } from "../../../components";
import {
  FaBell,
  FaPlay,
  FaPause,
  FaBan,
} from "react-icons/fa";
import { type DashboardFilters } from "../Dashboard";

export function SubscriptionsPanel({ filters }: { filters: DashboardFilters }) {
  const [data, setData] = useState<GetSubscriptionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    const client = new ApiClient({
      baseURL: import.meta.env.VITE_BACK_END_API,
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    });
    const params: Record<string, string> = {};
    if (filters.stage && filters.stage !== "__all__") params.stage = filters.stage;
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    client.dashboard
      .getSubscriptions(params as any)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [filters.stage, filters.dateFrom, filters.dateTo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="xl" />
      </div>
    );
  }
  if (error) return <div className="text-destructive text-sm py-4">Erro: {error}</div>;
  if (!data) return null;

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-emerald-500",
    PAUSED: "bg-amber-500",
    CANCELLED: "bg-red-500",
  };

  const typeColors: Record<string, string> = {
    TOPIC: "bg-blue-500",
    CRON: "bg-violet-500",
    FIXED_DATE: "bg-cyan-500",
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total de Inscrições" value={data.totalSubscriptions} icon={FaBell} />
        <StatCard label="Ativas" value={data.activeSubscriptions} icon={FaPlay} color="success" />
        <StatCard label="Pausadas" value={data.pausedSubscriptions} icon={FaPause} color="warning" />
        <StatCard label="Canceladas" value={data.cancelledSubscriptions} icon={FaBan} color="destructive" />
      </div>

      <Card className="p-4 border border-border bg-card">
        <BarChart
          title={filters.dateFrom || filters.dateTo ? "Inscrições Criadas no Período" : "Inscrições ao Longo do Tempo"}
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
            title="Por Status"
            items={data.byStatus.map((r: DashboardSubscriptionStatusCount) => ({
              label: r.status,
              value: r.count,
              color: statusColors[r.status] || "bg-primary",
            }))}
          />
        </Card>

        <Card className="p-4 border border-border bg-card">
          <BarChart
            title="Por Tipo"
            items={data.byType.map((r: DashboardSubscriptionTypeCount) => ({
              label: r.type,
              value: r.count,
              color: typeColors[r.type] || "bg-primary",
            }))}
          />
        </Card>
      </div>
    </div>
  );
}
