import React, { useContext, useEffect, useState } from "react";
import { SL } from "../../components/ShortcutLabel";
import { HotkeyContext } from "../../reducers/hotkeys.reducer";
import { Button, Card } from "@open-urbis/map-ui";
import {
  FaChartLine,
  FaProjectDiagram,
  FaPen,
  FaReceipt,
  FaUsers,
  FaHeartbeat,
  FaBell,
  FaChevronRight,
  FaColumns,
} from "react-icons/fa";
import { WorkflowOverviewPanel } from "./panels/WorkflowOverviewPanel";
import { SchemaManagementPanel } from "./panels/SchemaManagementPanel";
import { SignaturesPanel } from "./panels/SignaturesPanel";
import { TaxDocumentsPanel } from "./panels/TaxDocumentsPanel";
import { UsersIamPanel } from "./panels/UsersIamPanel";
import { SystemHealthPanel } from "./panels/SystemHealthPanel";
import { SubscriptionsPanel } from "./panels/SubscriptionsPanel";
import { WorkflowPipelinePanel } from "./panels/WorkflowPipelinePanel";

type PanelKey =
  | "workflows"
  | "pipeline"
  | "schemas"
  | "signatures"
  | "taxes"
  | "users"
  | "health"
  | "subscriptions";

const menus: {
  name: string;
  link: PanelKey;
  key: string;
  icon: React.ReactNode;
}[] = [
  {
    name: "Workflows",
    link: "workflows",
    key: "Q",
    icon: <FaChartLine />,
  },
  {
    name: "Pipeline",
    link: "pipeline",
    key: "W",
    icon: <FaColumns />,
  },
  {
    name: "Schemas",
    link: "schemas",
    key: "A",
    icon: <FaProjectDiagram />,
  },
  {
    name: "Assinaturas",
    link: "signatures",
    key: "E",
    icon: <FaPen />,
  },
  {
    name: "Taxas & Documentos",
    link: "taxes",
    key: "R",
    icon: <FaReceipt />,
  },
  {
    name: "Usuários & IAM",
    link: "users",
    key: "T",
    icon: <FaUsers />,
  },
  {
    name: "Saúde do Sistema",
    link: "health",
    key: "Y",
    icon: <FaHeartbeat />,
  },
  {
    name: "Inscrições",
    link: "subscriptions",
    key: "U",
    icon: <FaBell />,
  },
];

const panels: Record<PanelKey, React.FC> = {
  workflows: WorkflowOverviewPanel,
  pipeline: WorkflowPipelinePanel,
  schemas: SchemaManagementPanel,
  signatures: SignaturesPanel,
  taxes: TaxDocumentsPanel,
  users: UsersIamPanel,
  health: SystemHealthPanel,
  subscriptions: SubscriptionsPanel,
};

export function Dashboard(): JSX.Element {
  const hotkeyContext = useContext(HotkeyContext);
  const [subpage, setSubpage] = useState<PanelKey>("workflows");

  useEffect(() => {
    const hotkeyMap: Record<string, () => void> = {};
    menus.forEach((menu) => {
      hotkeyMap[menu.key] = () => setSubpage(menu.link);
    });

    hotkeyContext.dispatch({
      type: "SET_HOTKEY",
      payload: hotkeyMap,
    });

    return () => {
      hotkeyContext.dispatch({
        type: "UNSET_HOTKEY",
        delete: ["Q", "W", "A", "E", "R", "T", "Y", "U"],
      });
    };
  }, []);

  const ActivePanel = panels[subpage];

  return (
    <div className="flex flex-col space-y-2 mb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold mt-4 mb-6 tracking-tight text-foreground">
        Painel Administrativo
      </h1>

      <Card className="flex flex-grow border rounded-lg overflow-hidden border-border bg-card text-card-foreground">
        <div className="flex flex-col py-4 w-3/12 border-r border-border bg-card">
          {menus.map((menu) => (
            <div className="px-3 py-1" key={menu.key}>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setSubpage(menu.link)}
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
          <ActivePanel />
        </div>
      </Card>
    </div>
  );
}
