import React, { useEffect, useState } from "react";
import { getAccessToken } from "../../../auth/token";
import { ApiClient } from "../../../api";
import { GetSignaturesResponse, DashboardSignatureStateCount } from "../../../api/types/dashboard.dto";
import { StatCard } from "../components/StatCard";
import { BarChart } from "../components/BarChart";
import { Card } from "@open-urbis/map-ui";
import { Spinner } from "../../../components";
import {
  FaPen,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
} from "react-icons/fa";

export function SignaturesPanel() {
  const [data, setData] = useState<GetSignaturesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const client = new ApiClient({
      baseURL: import.meta.env.VITE_BACK_END_API,
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    });
    client.dashboard
      .getSignatures()
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
        <StatCard label="Total" value={data.totalSignatures} icon={FaPen} />
        <StatCard label="Pendentes" value={data.pendingCount} icon={FaClock} color="warning" />
        <StatCard label="Assinadas" value={data.signedCount} icon={FaCheckCircle} color="success" />
        <StatCard label="Rejeitadas" value={data.rejectedCount} icon={FaTimesCircle} color="destructive" />
      </div>

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
    </div>
  );
}
