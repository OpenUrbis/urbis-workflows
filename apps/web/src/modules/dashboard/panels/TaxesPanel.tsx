import React, { useEffect, useState } from "react";
import { getAccessToken } from "../../../auth/token";
import { ApiClient } from "../../../api";
import { GetTaxDocumentsResponse, DashboardTaxStateCount } from "../../../api/types/dashboard.dto";
import { StatCard } from "../components/StatCard";
import { BarChart } from "../components/BarChart";
import { Card } from "@open-urbis/map-ui";
import { Spinner } from "../../../components";
import {
  FaReceipt,
  FaExclamationTriangle,
} from "react-icons/fa";
import { type DashboardFilters } from "../Dashboard";

export function TaxesPanel({ filters }: { filters: DashboardFilters }) {
  const [data, setData] = useState<GetTaxDocumentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard label="Total de Taxas" value={data.totalTaxes} icon={FaReceipt} />
        <StatCard label="Taxas com Falha" value={data.failedTaxes} icon={FaExclamationTriangle} color="destructive" />
      </div>

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
    </div>
  );
}
