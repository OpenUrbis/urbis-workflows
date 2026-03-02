import React, { useEffect, useState } from "react";
import { getAccessToken } from "../../../auth/token";
import { ApiClient } from "../../../api";
import { GetUsersIamResponse } from "../../../api/types/dashboard.dto";
import { StatCard } from "../components/StatCard";
import { BarChart } from "../components/BarChart";
import { DataTable } from "../components/DataTable";
import { Card } from "@open-urbis/map-ui";
import { Spinner } from "../../../components";
import {
  FaUsers,
  FaUserSlash,
} from "react-icons/fa";

export function UsersIamPanel() {
  const [data, setData] = useState<GetUsersIamResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const client = new ApiClient({
      baseURL: import.meta.env.VITE_BACK_END_API,
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    });
    client.dashboard
      .getUsersIam()
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard label="Total de Usuários" value={data.totalUsers} icon={FaUsers} />
        <StatCard
          label="Sem Acesso IAM"
          value={data.usersWithoutIamAccess}
          icon={FaUserSlash}
          color={data.usersWithoutIamAccess > 0 ? "warning" : "success"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 border border-border bg-card">
          <DataTable
            title="Nível de Acesso"
            columns={[
              { header: "Nível", accessor: "label" },
              { header: "Qtd", accessor: (r) => r.count, className: "text-right tabular-nums" },
            ]}
            data={data.byAccessLevel}
          />
        </Card>

        <Card className="p-4 border border-border bg-card">
          <BarChart
            title="Registros nos Últimos 12 Meses"
            items={data.registrationsOverTime.map((r) => ({
              label: r.date.slice(5),
              value: r.count,
              color: "bg-primary/80",
            }))}
          />
        </Card>
      </div>
    </div>
  );
}
