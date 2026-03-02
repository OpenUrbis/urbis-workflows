import React, { useEffect, useState } from "react";
import { getAccessToken } from "../../../auth/token";
import { ApiClient } from "../../../api";
import { GetWorkflowOverviewResponse } from "../../../api/types/dashboard.dto";
import { StatCard } from "../components/StatCard";
import { BarChart } from "../components/BarChart";
import { DataTable } from "../components/DataTable";
import { Card } from "@open-urbis/map-ui";
import { Spinner } from "../../../components";
import {
  FaLayerGroup,
  FaCheckCircle,
  FaSpinner,
  FaClock,
} from "react-icons/fa";

function formatDuration(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}min`;
  const hours = Math.round(ms / 3_600_000);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

const stageColors: Record<string, string> = {
  development: "bg-blue-500",
  staging: "bg-amber-500",
  production: "bg-emerald-500",
};

export function WorkflowOverviewPanel() {
  const [data, setData] = useState<GetWorkflowOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const client = new ApiClient({
      baseURL: import.meta.env.VITE_BACK_END_API,
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    });
    client.dashboard
      .getWorkflowOverview()
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 border border-border bg-card">
          <BarChart
            title="Por Ambiente"
            items={data.byStage.map((r) => ({
              label: r.stage || "—",
              value: r.count,
              color: stageColors[r.stage || ""] || "bg-primary",
            }))}
          />
        </Card>

        <Card className="p-4 border border-border bg-card">
          <BarChart
            title="Criados nos Últimos 30 Dias"
            items={data.createdOverTime.map((r) => ({
              label: r.date.slice(5),
              value: r.count,
              color: "bg-primary/80",
            }))}
          />
        </Card>
      </div>

      {data.bottlenecks.length > 0 && (
        <Card className="p-4 border border-border bg-card">
          <DataTable
            title="Gargalos — Atividades com Mais Workflows Aguardando"
            columns={[
              { header: "Atividade", accessor: "activityLabel" },
              { header: "Tipo", accessor: "activityType" },
              {
                header: "Qtd",
                accessor: (r) => r.count,
                className: "text-right tabular-nums",
              },
            ]}
            data={data.bottlenecks}
          />
        </Card>
      )}
    </div>
  );
}
