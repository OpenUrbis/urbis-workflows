import { getAccessToken } from "../../../auth/token";
import React, { useContext, useEffect, useState } from "react";
import { FaPlus, FaCode, FaGlobe } from "react-icons/fa";
import {
  Button as DSButton,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@open-urbis/map-ui";
import { CodeModulesApiClient } from "../../../api/clients/code-modules.client";
import { CodeModule } from "../../../api/types/schema";
import { AddModule } from "../components/AddModule";
import { TreeList } from "../components/TreeList";
import { StyleContext } from "../../../reducers/style.reducer";
import { useSnackbar } from "../../../hooks/snackbar";
import { CodeModuleEditor } from "./library/CodeModuleEditor";
import {
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Spinner,
} from "../../../components/ChakraCompat";
import {
  HotkeyContext,
  withNoModifiers,
} from "../../../reducers/hotkeys.reducer";
import { SL } from "../../../components";

interface LibraryProps {
  codeModules: CodeModule[];
  onCodeModulesChange: (codeModules: CodeModule[]) => void;
}

const mapCodeModulesToTreeItems = (codeModules: CodeModule[]) => {
  return codeModules.map((module) => ({
    ...module,
    label: module.label || "Sem título",
    namespace: module.namespace || "global",
  }));
};

const getModuleIcon = (module: CodeModule) => {
  if (module.sourceEntityId) {
    return { icon: FaGlobe, color: "green" };
  }
  return { icon: FaCode, color: "yellow" };
};

export const WorkflowLibrary: React.FC<LibraryProps> = ({
  codeModules,
  onCodeModulesChange,
}) => {
  const styleContext = useContext(StyleContext);
  const hotkeyContext = useContext(HotkeyContext);
  const snackbar = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [globalModules, setGlobalModules] = useState<any[]>([]);
  const [selectedModule, setSelectedModule] = useState<CodeModule | null>(null);
  const [modulesSearch, setModulesSearch] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isAddingLocal, setIsAddingLocal] = useState(false);

  const api = new CodeModulesApiClient({
    baseURL: import.meta.env.VITE_BACK_END_API || "",
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
    },
  });

  const fetchGlobalModules = async () => {
    try {
      const response = await api.findAll();
      setGlobalModules(response.modules);
    } catch (error) {
      console.error("Error fetching global modules:", error);
      snackbar.error("Failed to fetch global modules");
    }
  };

  const fetchModuleDetails = async (module: CodeModule) => {
    setIsAddingLocal(false);

    if (module.sourceEntityId) {
      setLoading(true);
      try {
        let response;

        if (typeof module.sourceEntityId === "string") {
          response = await api.findOne(module.sourceEntityId);
        } else {
          response = await api.findOneVersion(
            module.sourceEntityId.id,
            module.sourceEntityId.version
          );
        }

        if (response) {
          setSelectedModule({
            ...module,
            code: response.code,
          });
        }
      } catch (error) {
        console.error("Error fetching module details:", error);
        snackbar.error("Failed to fetch module details");
        setSelectedModule(module);
      } finally {
        setLoading(false);
      }
    } else {
      setSelectedModule(module);
    }
  };

  useEffect(() => {
    fetchGlobalModules();
    hotkeyContext.dispatch({
      type: "SET_HOTKEY",
      payload: {
        N: withNoModifiers(() => {
          setIsAddingLocal(true);
        }),
      },
    });

    return () => {
      hotkeyContext.dispatch({
        type: "UNSET_HOTKEY",
        delete: ["N"],
      });
    };
    
  }, [hotkeyContext]);

  const handleAddGlobalModule = async (globalModule: any) => {
    const newModule: CodeModule = {
      id: crypto.randomUUID(),
      sourceEntityId: globalModule.id,
      label: globalModule.label,
      documentation: globalModule.documentation,
      namespace: globalModule.namespace,
    };

    onCodeModulesChange([...codeModules, newModule]);
    setIsOpen(false);
  };

  const handleAddLocalModule = (localModule: any) => {
    const newModule: CodeModule = {
      id: crypto.randomUUID(),
      label: localModule.label,
      documentation: localModule.documentation,
      namespace: localModule.namespace,
      code: localModule.code,
    };

    onCodeModulesChange([...codeModules, newModule]);
    setIsAddingLocal(false);
  };

  const handleRemoveModule = async (module: CodeModule) => {
    const confirmDelete = await (window as any).confirmation(
      `Tem certeza que deseja remover o módulo "${module.label}"?`,
      {
        title: "Remover Módulo",
        type: "warning",
        confirmText: "Remover",
        cancelText: "Cancelar",
      }
    );

    if (!confirmDelete) return;

    const updatedModules = codeModules.filter((m) => m.id !== module.id);
    onCodeModulesChange(updatedModules);
    setSelectedModule(null);
  };

  const handleUpdateModule = (updates: Partial<CodeModule>) => {
    if (!selectedModule) return;

    const updatedModules = codeModules.map((module) =>
      module.id === selectedModule.id ? { ...module, ...updates } : module
    );

    onCodeModulesChange(updatedModules);
    setSelectedModule({ ...selectedModule, ...updates });
  };

  const handleCloseModal = () => {
    setGlobalSearch("");
    setIsOpen(false);
  };

  return (
    <div className="flex h-full">
      <div
        className="w-1/3 border-r pr-4"
        style={{
          borderColor:
            styleContext.state.buttonHoverColorWeight === "200"
              ? "#E5E7EB"
              : "#374151",
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2
            className="text-xl font-bold"
            style={{ color: styleContext.state.textColor }}
          >
            Módulos
          </h2>
        </div>

        {codeModules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <FaCode size={32} className="mb-4 opacity-50" />
            <p
              className="text-sm text-center mb-2"
              style={{ color: styleContext.state.textColor }}
            >
              Nenhum módulo cadastrado
            </p>
            <p
              className="text-xs text-center"
              style={{ color: styleContext.state.textColor }}
            >
              Adicione um módulo usando o botão abaixo
            </p>
          </div>
        ) : (
          <TreeList
            items={mapCodeModulesToTreeItems(codeModules)}
            search={modulesSearch}
            onClick={(module) => fetchModuleDetails(module)}
            onSearchChange={setModulesSearch}
            icon={FaCode}
            iconColor="yellow"
            getIcon={getModuleIcon}
            selectedId={selectedModule?.id}
          />
        )}
        <div className="mt-4">
          <Menu>
            <MenuButton
              className={`h-11 w-full rounded-xl px-4 font-semibold shadow-sm inline-flex items-center justify-center gap-2 text-white ${
                styleContext.state.buttonHoverColorWeight === "200"
                  ? "bg-yellow-600 hover:bg-yellow-700"
                  : "bg-yellow-800 hover:bg-yellow-900"
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <FaPlus size={14} />
                <span>Módulo</span>
                <SL bg="primary">N</SL>
              </div>
            </MenuButton>
            <MenuList
              className={`min-w-[220px] border ${
                styleContext.state.buttonHoverColorWeight === "200"
                  ? "bg-white border-gray-200"
                  : "bg-gray-800 border-gray-600"
              }`}
            >
              <MenuItem
                onClick={() => setIsOpen(true)}
                className={`cursor-pointer ${
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "hover:bg-gray-100"
                    : "hover:bg-gray-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <FaCode />
                  <span style={{ color: styleContext.state.textColor }}>
                    Importar Global
                  </span>
                </div>
              </MenuItem>
              <MenuItem
                onClick={() => setIsAddingLocal(true)}
                className={`cursor-pointer ${
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "hover:bg-gray-100"
                    : "hover:bg-gray-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <FaCode />
                  <span style={{ color: styleContext.state.textColor }}>
                    Criar Local
                  </span>
                </div>
              </MenuItem>
            </MenuList>
          </Menu>
        </div>
      </div>

      <div className="flex-1 pl-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Spinner size="xl" />
          </div>
        ) : isAddingLocal ? (
          <AddModule onAddFunction={handleAddLocalModule} fixedButton={false} />
        ) : selectedModule ? (
          <CodeModuleEditor
            codeModule={selectedModule}
            onUpdate={handleUpdateModule}
            onRemove={() => handleRemoveModule(selectedModule)}
            isGlobal={!!selectedModule.sourceEntityId}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <FaCode size={48} className="mb-4 opacity-50" />
            <p
              className="text-xl font-medium mb-2"
              style={{ color: styleContext.state.textColor }}
            >
              Nenhum módulo selecionado
            </p>
            <p
              className="text-sm mb-6"
              style={{ color: styleContext.state.textColor }}
            >
              Selecione um módulo da lista ao lado ou crie um novo
            </p>
            <Menu>
              <MenuButton
                className={`h-11 rounded-xl px-4 font-semibold shadow-sm inline-flex items-center justify-center gap-2 text-white ${
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "bg-yellow-600 hover:bg-yellow-700"
                    : "bg-yellow-800 hover:bg-yellow-900"
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <FaPlus size={14} />
                  <span>Módulo</span>
                  <SL bg="primary">N</SL>
                </div>
              </MenuButton>
              <MenuList
                className={`min-w-[220px] border ${
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "bg-white border-gray-200"
                    : "bg-gray-800 border-gray-600"
                }`}
              >
                <MenuItem
                  onClick={() => setIsOpen(true)}
                  className={`cursor-pointer ${
                    styleContext.state.buttonHoverColorWeight === "200"
                      ? "hover:bg-gray-100"
                      : "hover:bg-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FaCode />
                    <span style={{ color: styleContext.state.textColor }}>
                      Importar Global
                    </span>
                  </div>
                </MenuItem>
                <MenuItem
                  onClick={() => setIsAddingLocal(true)}
                  className={`cursor-pointer ${
                    styleContext.state.buttonHoverColorWeight === "200"
                      ? "hover:bg-gray-100"
                      : "hover:bg-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FaCode />
                    <span style={{ color: styleContext.state.textColor }}>
                      Criar Local
                    </span>
                  </div>
                </MenuItem>
              </MenuList>
            </Menu>
          </div>
        )}
      </div>

      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseModal();
        }}
      >
        <DialogContent
          className="sm:max-w-3xl"
          style={{
            backgroundColor: styleContext.state.backgroundColor,
            borderColor:
              styleContext.state.buttonHoverColorWeight === "200"
                ? "#e5e7eb"
                : "#4b5563",
          }}
        >
          <DialogHeader>
            <DialogTitle asChild>
              <span style={{ color: styleContext.state.textColor }}>
                Importar módulo global
              </span>
            </DialogTitle>
          </DialogHeader>

          <div>
            <TreeList
              items={globalModules}
              search={globalSearch}
              onClick={handleAddGlobalModule}
              onSearchChange={setGlobalSearch}
              icon={FaGlobe}
              iconColor="green"
            />
          </div>

          <DialogFooter>
            <Button
              onClick={handleCloseModal}
              style={{
                backgroundColor:
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "#f3f4f6"
                    : "#1f2937",
                color: styleContext.state.textColor,
              }}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
