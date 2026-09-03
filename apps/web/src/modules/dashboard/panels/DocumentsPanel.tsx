import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAccessToken } from "../../../auth/token";
import { ApiClient } from "../../../api";
import { GetTaxDocumentsResponse } from "../../../api/types/dashboard.dto";
import { StatCard } from "../components/StatCard";
import { BarChart } from "../components/BarChart";
import { DataTable } from "../components/DataTable";
import { Card } from "@open-urbis/map-ui";
import { Spinner } from "../../../components";
import { FaFileAlt } from "react-icons/fa";
import { type DashboardFilters } from "../Dashboard";

export function DocumentsPanel({ filters }: { filters: DashboardFilters }) {
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
    if (filters.stage && filters.stage !== "__all__") params.stage = filters.stage;
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard label="Total de Documentos" value={data.totalDocuments} icon={FaFileAlt} />
      </div>

      <Card className="p-4 border border-border bg-card">
        <BarChart
          title="Documentos ao Longo do Tempo"
          items={(data.documentCreatedOverTime ?? []).map((r) => ({
            label: formatBucketLabel(r.date),
            value: r.count,
            color: "bg-primary/80",
          }))}
        />
      </Card>

      {(data.documentByLabel ?? []).length > 0 && (
        <Card className="p-4 border border-border bg-card">
          <DataTable
            title="Por Tipo de Documento"
            columns={[
              { header: "Tipo", accessor: "label" },
              { header: "Assunto", accessor: (r) => r.schemaLabel || "—", className: "text-muted-foreground" },
              { header: "Total", accessor: (r) => r.total, className: "text-right tabular-nums font-medium" },
            ]}
            data={data.documentByLabel}
          />
        </Card>
      )}

      {(data.topDocumentsByWorkflow ?? []).length > 0 && (
        <Card className="p-4 border border-border bg-card">
          <DataTable
            title="Pedidos com Mais Documentos"
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
              { header: "Documentos", accessor: (r) => r.documentCount, className: "text-right tabular-nums font-medium" },
            ]}
            data={data.topDocumentsByWorkflow}
          />
        </Card>
      )}
    </div>
  );
}
