import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAccessToken } from "../../../auth/token";
import { ApiClient } from "../../../api";
import { GetSchemaManagementResponse } from "../../../api/types/dashboard.dto";
import { StatCard } from "../components/StatCard";
import { DataTable } from "../components/DataTable";
import { Badge, Card } from "@open-urbis/map-ui";
import { Spinner } from "../../../components";
import { FaProjectDiagram, FaCheck, FaTrash } from "react-icons/fa";
import { type DashboardFilters } from "../Dashboard";

function formatDuration(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}min`;
  const hours = Math.round(ms / 3_600_000);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

export function SchemaManagementPanel({ filters }: { filters: DashboardFilters }) {
  const [data, setData] = useState<GetSchemaManagementResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleAssuntoClick = useCallback(
    (schemaLabel: string, e: React.MouseEvent) => {
      const params = new URLSearchParams();
      if (filters.stage) params.set("stage", filters.stage);
      if (schemaLabel) params.set("label", schemaLabel);
      const url = `/workflows/all?${params.toString()}`;
      if (e.ctrlKey || e.metaKey) {
        window.open(url, "_blank");
      } else {
        navigate(url);
      }
    },
    [filters.stage, navigate],
  );

  useEffect(() => {
    const client = new ApiClient({
      baseURL: import.meta.env.VITE_BACK_END_API,
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    });
    client.dashboard
      .getSchemaManagement()
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total de Assuntos" value={data.totalSchemas} icon={FaProjectDiagram} />
        <StatCard label="Ativos" value={data.activeSchemas} icon={FaCheck} color="success" />
        <StatCard label="Deletados" value={data.deletedSchemas} icon={FaTrash} color="destructive" />
      </div>

      <Card className="p-4 border border-border bg-card">
        <DataTable
          title="Ambientes por Assunto"
          columns={[
            {
              header: "Assunto",
              accessor: (r) => (
                <button
                  type="button"
                  className="text-left text-primary underline decoration-primary/30 hover:decoration-primary transition-colors"
                  onClick={(e) => handleAssuntoClick(r.schemaLabel, e)}
                >
                  {r.schemaLabel}
                </button>
              ),
            },
            {
              header: "DEV",
              accessor: (r) => r.hasDevelopment ? (
                <Badge variant="outline" className="text-blue-500 border-blue-500/30 bg-blue-500/10 text-xs">Sim</Badge>
              ) : (
                <span className="text-muted-foreground text-xs">—</span>
              ),
            },
            {
              header: "STG",
              accessor: (r) => r.hasStaging ? (
                <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/10 text-xs">Sim</Badge>
              ) : (
                <span className="text-muted-foreground text-xs">—</span>
              ),
            },
            {
              header: "PROD",
              accessor: (r) => r.hasProduction ? (
                <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 bg-emerald-500/10 text-xs">Sim</Badge>
              ) : (
                <span className="text-muted-foreground text-xs">—</span>
              ),
            },
            {
              header: "Status",
              accessor: (r) => r.deleted ? (
                <Badge variant="destructive" className="text-xs">Deletado</Badge>
              ) : (
                <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 text-xs">Ativo</Badge>
              ),
            },
          ]}
          data={data.environments}
        />
      </Card>

      {data.usage.length > 0 && (
        <Card className="p-4 border border-border bg-card">
          <DataTable
            title="Uso por Assunto"
            columns={[
              {
                header: "Assunto",
                accessor: (r) => (
                  <button
                    type="button"
                    className="text-left text-primary underline decoration-primary/30 hover:decoration-primary transition-colors"
                    onClick={(e) => handleAssuntoClick(r.schemaLabel, e)}
                  >
                    {r.schemaLabel}
                  </button>
                ),
              },
              { header: "Total", accessor: (r) => r.totalInstances, className: "text-right tabular-nums" },
              { header: "Concluídos", accessor: (r) => r.completedInstances, className: "text-right tabular-nums" },
              { header: "Em Andamento", accessor: (r) => r.inProgressInstances, className: "text-right tabular-nums" },
              { header: "Tempo Médio", accessor: (r) => formatDuration(r.avgCompletionTimeMs), className: "text-right tabular-nums" },
            ]}
            data={data.usage}
          />
        </Card>
      )}
    </div>
  );
}
