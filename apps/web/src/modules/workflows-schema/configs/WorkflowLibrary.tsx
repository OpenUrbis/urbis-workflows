import { getAccessToken } from "../../../auth/token";
import React, { useContext, useEffect, useState } from "react";
import {
  Spinner,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@chakra-ui/react";
import { FaPlus, FaCode, FaGlobe } from "react-icons/fa";
import { Button as DSButton } from "@open-urbis/map-ui";
import { CodeModulesApiClient } from "../../../api/clients/code-modules.client";
import { CodeModule } from "../../../api/types/schema";
import { AddModule } from "../components/AddModule";
import { TreeList } from "../components/TreeList";
import { StyleContext } from "../../../reducers/style.reducer";
import { useSnackbar } from "../../../hooks/snackbar";
import { CodeModuleEditor } from "./library/CodeModuleEditor";
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
  const { isOpen, onOpen, onClose } = useDisclosure();
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
    onClose();
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
    onClose();
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
              as={DSButton}
              className="h-11 w-full rounded-xl px-4 font-semibold shadow-sm inline-flex items-center justify-center gap-2"
              bg={
                styleContext.state.buttonHoverColorWeight === "200"
                  ? "#ca8a04"
                  : "#854d0e"
              }
              color="#ffffff"
              _hover={{
                bg:
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "#a16207"
                    : "#713f12",
              }}
            >
              <div className="flex items-center justify-center space-x-2">
                <FaPlus size={14} />
                <span>Módulo</span>
                <SL bg="primary">N</SL>
              </div>
            </MenuButton>
            <MenuList
              bg={
                styleContext.state.buttonHoverColorWeight === "200"
                  ? "white"
                  : "gray.800"
              }
              borderColor={
                styleContext.state.buttonHoverColorWeight === "200"
                  ? "gray.200"
                  : "gray.600"
              }
            >
              <MenuItem
                icon={<FaCode />}
                onClick={onOpen}
                bg={
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "white"
                    : "gray.800"
                }
                _hover={{
                  bg:
                    styleContext.state.buttonHoverColorWeight === "200"
                      ? "gray.100"
                      : "gray.700",
                }}
              >
                <span style={{ color: styleContext.state.textColor }}>
                  Importar Global
                </span>
              </MenuItem>
              <MenuItem
                icon={<FaCode />}
                onClick={() => setIsAddingLocal(true)}
                bg={
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "white"
                    : "gray.800"
                }
                _hover={{
                  bg:
                    styleContext.state.buttonHoverColorWeight === "200"
                      ? "gray.100"
                      : "gray.700",
                }}
              >
                <span style={{ color: styleContext.state.textColor }}>
                  Criar Local
                </span>
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
                as={DSButton}
                className="h-11 rounded-xl px-4 font-semibold shadow-sm inline-flex items-center justify-center gap-2"
                bg={
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "#ca8a04"
                    : "#854d0e"
                }
                color="#ffffff"
                _hover={{
                  bg:
                    styleContext.state.buttonHoverColorWeight === "200"
                      ? "#a16207"
                      : "#713f12",
                }}
              >
                <div className="flex items-center justify-center space-x-2">
                  <FaPlus size={14} />
                  <span>Módulo</span>
                  <SL bg="primary">N</SL>
                </div>
              </MenuButton>
              <MenuList
                bg={
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "white"
                    : "gray.800"
                }
                borderColor={
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "gray.200"
                    : "gray.600"
                }
              >
                <MenuItem
                  icon={<FaCode />}
                  onClick={onOpen}
                  bg={
                    styleContext.state.buttonHoverColorWeight === "200"
                      ? "white"
                      : "gray.800"
                  }
                  _hover={{
                    bg:
                      styleContext.state.buttonHoverColorWeight === "200"
                        ? "gray.100"
                        : "gray.700",
                  }}
                >
                  <span style={{ color: styleContext.state.textColor }}>
                    Importar Global
                  </span>
                </MenuItem>
                <MenuItem
                  icon={<FaCode />}
                  onClick={() => setIsAddingLocal(true)}
                  bg={
                    styleContext.state.buttonHoverColorWeight === "200"
                      ? "white"
                      : "gray.800"
                  }
                  _hover={{
                    bg:
                      styleContext.state.buttonHoverColorWeight === "200"
                        ? "gray.100"
                        : "gray.700",
                  }}
                >
                  <span style={{ color: styleContext.state.textColor }}>
                    Criar Local
                  </span>
                </MenuItem>
              </MenuList>
            </Menu>
          </div>
        )}
      </div>

      <Modal isOpen={isOpen} onClose={handleCloseModal} size="xl">
        <ModalOverlay />
        <ModalContent
          bg={styleContext.state.backgroundColor}
          borderColor={
            styleContext.state.buttonHoverColorWeight === "200"
              ? "gray.200"
              : "gray.600"
          }
        >
          <ModalHeader style={{ color: styleContext.state.textColor }}>
            Importar módulo global
          </ModalHeader>
          <ModalBody>
            <TreeList
              items={globalModules}
              search={globalSearch}
              onClick={(module) => handleAddGlobalModule(module)}
              onSearchChange={setGlobalSearch}
              icon={FaGlobe}
              iconColor="green"
            />
          </ModalBody>
          <ModalFooter>
            <Button
              onClick={handleCloseModal}
              style={{
                backgroundColor:
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "#E5E7EB"
                    : "#374151",
                color: styleContext.state.textColor,
              }}
              _hover={{
                backgroundColor:
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "#D1D5DB"
                    : "#4B5563",
              }}
            >
              Cancelar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};
