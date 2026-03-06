import React, { useContext, useEffect, useState } from "react";
import { SL } from "../../components/ShortcutLabel";
import { HotkeyContext } from "../../reducers/hotkeys.reducer";
import {
  Button,
  Card,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@open-urbis/map-ui";
import {
  FaProjectDiagram,
  FaUsers,
  FaHeartbeat,
  FaBell,
  FaChevronRight,
} from "react-icons/fa";
import { useSearchParams } from "react-router-dom";
import { SchemaManagementPanel } from "./panels/SchemaManagementPanel";
import { UsersIamPanel } from "./panels/UsersIamPanel";
import { SystemHealthPanel } from "./panels/SystemHealthPanel";
import { SubscriptionsPanel } from "./panels/SubscriptionsPanel";
import { type DashboardFilters } from "./Dashboard";

const STAGE_OPTIONS = [
  { value: "production", label: "Produção" },
  { value: "staging", label: "Homologação" },
  { value: "development", label: "Desenvolvimento" },
];

const PERIOD_OPTIONS = [
  { value: "__all__", label: "Todo o período" },
  { value: "7", label: "Últimos 7 dias" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
  { value: "365", label: "Último ano" },
];

type PanelKey = "schemas" | "users" | "health" | "subscriptions";

const menus: {
  name: string;
  link: PanelKey;
  key: string;
  icon: React.ReactNode;
}[] = [
  {
    name: "Assuntos",
    link: "schemas",
    key: "Q",
    icon: <FaProjectDiagram />,
  },
  {
    name: "Usuários & IAM",
    link: "users",
    key: "A",
    icon: <FaUsers />,
  },
  {
    name: "Saúde do Sistema",
    link: "health",
    key: "E",
    icon: <FaHeartbeat />,
  },
  {
    name: "Inscrições",
    link: "subscriptions",
    key: "R",
    icon: <FaBell />,
  },
];

const panels: Record<PanelKey, React.FC<{ filters: DashboardFilters }>> = {
  schemas: SchemaManagementPanel,
  users: UsersIamPanel,
  health: SystemHealthPanel,
  subscriptions: SubscriptionsPanel,
};

export function AdminPanel(): JSX.Element {
  const hotkeyContext = useContext(HotkeyContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [subpage, setSubpage] = useState<PanelKey>(() => {
    const tab = (searchParams.get("tab") as PanelKey) || "schemas";
    return (Object.keys(panels) as PanelKey[]).includes(tab) ? tab : "schemas";
  });
  const [stage, setStage] = useState(() => searchParams.get("stage") || "production");
  const [period, setPeriod] = useState(() => searchParams.get("period") || "__all__");

  const syncQueryParams = (next: { tab?: PanelKey; stage?: string; period?: string }) => {
    const params = new URLSearchParams(searchParams);

    const desiredTab = next.tab ?? subpage;
    const currentTab = searchParams.get("tab") || "";
    if (desiredTab) {
      if (currentTab !== desiredTab) params.set("tab", desiredTab);
    } else {
      if (currentTab) params.delete("tab");
    }

    const desiredStage = next.stage ?? stage;
    const currentStage = searchParams.get("stage") || "";
    if (desiredStage) {
      if (currentStage !== desiredStage) params.set("stage", desiredStage);
    } else {
      if (currentStage) params.delete("stage");
    }

    const desiredPeriod = (next.period ?? period) && (next.period ?? period) !== "__all__"
      ? (next.period ?? period)
      : "";
    const currentPeriod = searchParams.get("period") || "";
    if (desiredPeriod) {
      if (currentPeriod !== desiredPeriod) params.set("period", desiredPeriod);
    } else {
      if (currentPeriod) params.delete("period");
    }

    if (params.toString() !== searchParams.toString()) {
      setSearchParams(params, { replace: true });
    }
  };

  useEffect(() => {
    const tab = (searchParams.get("tab") as PanelKey) || "schemas";
    const nextTab = (Object.keys(panels) as PanelKey[]).includes(tab) ? tab : "schemas";
    if (nextTab !== subpage) setSubpage(nextTab);

    const nextStage = searchParams.get("stage") || "production";
    if (nextStage !== stage) setStage(nextStage);

    const nextPeriod = searchParams.get("period") || "__all__";
    if (nextPeriod !== period) setPeriod(nextPeriod);
  }, [searchParams]);

  const setSubpageAndSync = (next: PanelKey) => {
    setSubpage(next);
    syncQueryParams({ tab: next });
  };

  const setStageAndSync = (next: string) => {
    setStage(next);
    syncQueryParams({ stage: next });
  };

  const setPeriodAndSync = (next: string) => {
    setPeriod(next);
    syncQueryParams({ period: next });
  };

  const filters: DashboardFilters = React.useMemo(() => {
    const f: DashboardFilters = { stage };
    if (period !== "__all__") {
      const now = new Date();
      const from = new Date(now);
      from.setDate(from.getDate() - Number(period));
      f.dateFrom = from.toISOString();
      f.dateTo = now.toISOString();
    }
    return f;
  }, [stage, period]);

  useEffect(() => {
    const hotkeyMap: Record<string, () => void> = {};
    menus.forEach((menu) => {
      hotkeyMap[menu.key] = () => setSubpageAndSync(menu.link);
    });

    hotkeyContext.dispatch({
      type: "SET_HOTKEY",
      payload: hotkeyMap,
    });

    return () => {
      hotkeyContext.dispatch({
        type: "UNSET_HOTKEY",
        delete: menus.map((m) => m.key),
      });
    };
  }, []);

  const ActivePanel = panels[subpage];

  return (
    <div className="flex flex-col space-y-2 mb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold mt-4 mb-4 tracking-tight text-foreground">
        Painel Administrativo
      </h1>

      <div className="flex flex-wrap items-center gap-3 mb-2">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
            Ambiente
          </label>
          <Select value={stage} onValueChange={setStageAndSync}>
            <SelectTrigger className="h-8 w-44 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STAGE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
            Período
          </label>
          <Select value={period} onValueChange={setPeriodAndSync}>
            <SelectTrigger className="h-8 w-44 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="flex flex-grow border rounded-lg overflow-hidden border-border bg-card text-card-foreground">
        <div className="flex flex-col py-4 w-3/12 border-r border-border bg-card">
          {menus.map((menu) => (
            <div className="px-3 py-1" key={menu.key}>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setSubpageAndSync(menu.link)}
                className={`flex justify-between w-full items-center h-auto px-4 py-2.5 font-normal rounded-lg transition-colors duration-150 ${
                  subpage === menu.link
                    ? "bg-primary/10 text-primary hover:bg-primary/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <span
                    className={
                      subpage === menu.link
                        ? "text-primary"
                        : "text-muted-foreground"
                    }
                  >
                    {menu.icon}
                  </span>
                  <span className="text-sm font-medium truncate">
                    {menu.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <SL>{menu.key}</SL>
                  {subpage === menu.link && (
                    <FaChevronRight size={10} className="text-primary" />
                  )}
                </div>
              </Button>
            </div>
          ))}
        </div>
        <div className="flex flex-col p-6 w-9/12 overflow-y-auto bg-background text-foreground">
          <ActivePanel filters={filters} />
        </div>
      </Card>
    </div>
  );
}
