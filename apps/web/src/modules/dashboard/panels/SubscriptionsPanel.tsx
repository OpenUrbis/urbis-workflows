import React, { useEffect, useState } from "react";
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
} from "react-icons/fa";

export function SubscriptionsPanel() {
  const [data, setData] = useState<GetSubscriptionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const client = new ApiClient({
      baseURL: import.meta.env.VITE_BACK_END_API,
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    });
    client.dashboard
      .getSubscriptions()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard label="Total de Inscrições" value={data.totalSubscriptions} icon={FaBell} />
        <StatCard label="Ativas" value={data.activeSubscriptions} icon={FaPlay} color="success" />
      </div>

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
