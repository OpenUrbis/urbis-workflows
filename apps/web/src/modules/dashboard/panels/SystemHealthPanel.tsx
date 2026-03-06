import React, { useEffect, useState } from "react";
import { getAccessToken } from "../../../auth/token";
import { ApiClient } from "../../../api";
import { GetSystemHealthResponse } from "../../../api/types/dashboard.dto";
import { StatCard } from "../components/StatCard";
import { DataTable } from "../components/DataTable";
import { Card } from "@open-urbis/map-ui";
import { Spinner } from "../../../components";
import {
  FaExclamationTriangle,
  FaSearch,
  FaChartBar,
} from "react-icons/fa";
import { type DashboardFilters } from "../Dashboard";

export function SystemHealthPanel({ filters: _filters }: { filters: DashboardFilters }) {
  const [data, setData] = useState<GetSystemHealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const client = new ApiClient({
      baseURL: import.meta.env.VITE_BACK_END_API,
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    });
    client.dashboard
      .getSystemHealth()
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
          label="Pedidos Não Indexados"
          value={data.unindexedWorkflows}
          icon={FaSearch}
          color={data.unindexedWorkflows > 0 ? "warning" : "success"}
        />
        <StatCard
          label="Stats Não Indexados"
          value={data.unindexedStats}
          icon={FaChartBar}
          color={data.unindexedStats > 0 ? "warning" : "success"}
        />
      </div>

      {data.deadLettersByQueue.length > 0 && (
        <Card className="p-4 border border-border bg-card">
          <DataTable
            title="Dead Letters por Fila"
            columns={[
              { header: "Fila", accessor: "queueName" },
              { header: "Total", accessor: (r) => r.total, className: "text-right tabular-nums" },
              { header: "Não Reprocessadas", accessor: (r) => r.unprocessed, className: "text-right tabular-nums" },
            ]}
            data={data.deadLettersByQueue}
          />
        </Card>
      )}
    </div>
  );
}
