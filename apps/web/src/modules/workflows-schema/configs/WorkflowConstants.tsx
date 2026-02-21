import { getAccessToken } from "../../../auth/token";
import React, { useContext, useEffect, useState } from "react";
import {
  Spinner,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
} from "@chakra-ui/react";
import { FaPlus, FaGlobe, FaCode } from "react-icons/fa";
import {
  Button as DSButton,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@open-urbis/map-ui";
import { ApiClient } from "../../../api";
import { ConstantVariable } from "../../../api/types/schema";
import { AddEnvironment } from "../components/AddEnvironment";
import { TreeList } from "../components/TreeList";
import { StyleContext } from "../../../reducers/style.reducer";
import { useSnackbar } from "../../../hooks/snackbar";
import { ConstantEditor } from "./constants/ConstantEditor";
import {
  HotkeyContext,
  withNoModifiers,
} from "../../../reducers/hotkeys.reducer";
import { SL } from "../../../components";

interface ConstantsProps {
  constants: ConstantVariable[];
  onConstantsChange: (constants: ConstantVariable[]) => void;
}

const mapConstantsToTreeItems = (constants: ConstantVariable[]) => {
  return constants.map((constant) => ({
    ...constant,
    label: constant.label || "Sem título",
    namespace: constant.namespace || "global",
  }));
};

export const WorkflowConstants: React.FC<ConstantsProps> = ({
  constants,
  onConstantsChange,
}) => {
  const styleContext = useContext(StyleContext);
  const hotkeyContext = useContext(HotkeyContext);
  const snackbar = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [globalConstants, setGlobalConstants] = useState<any[]>([]);
  const [selectedConstant, setSelectedConstant] =
    useState<ConstantVariable | null>(null);
  const [constantsSearch, setConstantsSearch] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isAddingLocal, setIsAddingLocal] = useState(false);

  const api = new ApiClient({
    baseURL: import.meta.env.VITE_BACK_END_API || "",
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
    },
  });

  const fetchGlobalConstants = async () => {
    try {
      const response = await api.constantVariables.findAll();
      setGlobalConstants(response.variables);
    } catch (error) {
      console.error("Error fetching global constants:", error);
      snackbar.error("Failed to fetch global constants");
    }
  };

  const fetchConstantDetails = async (constant: ConstantVariable) => {
    // Reset the adding state if we're selecting a constant
    setIsAddingLocal(false);

    if (constant.sourceEntityId) {
      setLoading(true);
      try {
        let response;

        if (typeof constant.sourceEntityId === "string") {
          response = await api.constantVariables.findOne(
            constant.sourceEntityId
          );
        } else {
          response = await api.constantVariables.findOneVersion(
            constant.sourceEntityId.id,
            constant.sourceEntityId.version
          );
        }

        if (response) {
          setSelectedConstant({
            ...constant,
            value: response.value,
            type: response.type,
          });
        }
      } catch (error) {
        console.error("Error fetching constant details:", error);
        snackbar.error("Failed to fetch constant details");
        setSelectedConstant(constant);
      } finally {
        setLoading(false);
      }
    } else {
      setSelectedConstant(constant);
    }
  };

  useEffect(() => {
    fetchGlobalConstants();
    
  }, []);

  useEffect(() => {
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

  const handleAddGlobalConstant = async (globalConstant: any) => {
    // For global constants, we only need to store the sourceEntityId and display information
    const newConstant: ConstantVariable = {
      id: crypto.randomUUID(), // Generate a new local ID
      sourceEntityId: globalConstant.id, // Store the reference to the global constant
      label: globalConstant.label, // Store label for display in tree
      documentation: globalConstant.documentation, // Store documentation for display
      namespace: globalConstant.namespace || "global", // Preserve the namespace structure
    };

    const updatedConstants = [...constants, newConstant];
    onConstantsChange(updatedConstants);
    onClose();
  };

  const handleAddLocalConstant = (localConstant: any) => {
    // For local constants, we store all the information
    const newConstant: ConstantVariable = {
      id: crypto.randomUUID(),
      label: localConstant.label,
      documentation: localConstant.documentation,
      namespace: localConstant.namespace,
      type: localConstant.type,
      value: localConstant.value,
    };

    const updatedConstants = [...constants, newConstant];
    onConstantsChange(updatedConstants);
    setIsAddingLocal(false);
  };

  const handleRemoveConstant = async (constant: ConstantVariable) => {
    const confirmDelete = await (window as any).confirmation(
      `Tem certeza que deseja remover a variável "${constant.label}"?`,
      {
        title: "Remover Variável",
        type: "warning",
        confirmText: "Remover",
        cancelText: "Cancelar",
      }
    );

    if (!confirmDelete) return;

    const updatedConstants = constants.filter((c) => c.id !== constant.id);
    onConstantsChange(updatedConstants);
    setSelectedConstant(null);
  };

  const handleUpdateConstant = (updates: Partial<ConstantVariable>) => {
    if (!selectedConstant) return;

    const updatedConstants = constants.map((constant) =>
      constant.id === selectedConstant.id
        ? { ...constant, ...updates }
        : constant
    );

    onConstantsChange(updatedConstants);
    setSelectedConstant({ ...selectedConstant, ...updates });
  };

  const getConstantIcon = (constant: ConstantVariable) => {
    if (constant.sourceEntityId) {
      return { icon: FaGlobe, color: "green" };
    }
    return { icon: FaCode, color: "blue" };
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
            Variáveis
          </h2>
        </div>

        {constants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <FaCode size={32} className="mb-4 opacity-50" />
            <p
              className="text-sm text-center mb-2"
              style={{ color: styleContext.state.textColor }}
            >
              Nenhuma variável cadastrada
            </p>
            <p
              className="text-xs text-center"
              style={{ color: styleContext.state.textColor }}
            >
              Adicione uma variável usando o botão abaixo
            </p>
          </div>
        ) : (
          <TreeList
            items={mapConstantsToTreeItems(constants)}
            search={constantsSearch}
            onClick={(constant) => fetchConstantDetails(constant)}
            onSearchChange={setConstantsSearch}
            icon={FaCode}
            iconColor="blue"
            getIcon={getConstantIcon}
            selectedId={selectedConstant?.id}
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
                <span>Variável</span>
                <SL bg="yellow.600">N</SL>
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
                icon={<FaGlobe />}
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
          <AddEnvironment
            onAddEnvironment={handleAddLocalConstant}
            fixedButton={false}
          />
        ) : selectedConstant ? (
          <ConstantEditor
            constant={selectedConstant}
            onUpdate={handleUpdateConstant}
            onRemove={() => handleRemoveConstant(selectedConstant)}
            isGlobal={!!selectedConstant.sourceEntityId}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <FaCode size={48} className="mb-4 opacity-50" />
            <p
              className="text-xl font-medium mb-2"
              style={{ color: styleContext.state.textColor }}
            >
              Nenhuma variável selecionada
            </p>
            <p
              className="text-sm mb-6"
              style={{ color: styleContext.state.textColor }}
            >
              Selecione uma variável da lista ao lado ou crie uma nova
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
                  <span>Variável</span>
                  <SL bg="yellow.600">N</SL>
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
                  icon={<FaGlobe />}
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

      <Dialog open={isOpen} onOpenChange={(open) => !open && handleCloseModal()}>
        <DialogContent
          className="max-w-3xl"
          style={{
            backgroundColor: styleContext.state.backgroundColor,
            borderColor:
              styleContext.state.buttonHoverColorWeight === "200"
                ? "#E5E7EB"
                : "#4B5563",
            color: styleContext.state.textColor,
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: styleContext.state.textColor }}>
              Importar variável global
            </DialogTitle>
          </DialogHeader>
          <div>
            <TreeList
              items={globalConstants}
              search={globalSearch}
              onClick={(constant) => handleAddGlobalConstant(constant)}
              onSearchChange={setGlobalSearch}
              icon={FaGlobe}
              iconColor="green"
            />
          </div>
          <DialogFooter>
            <DSButton variant="outline" onClick={handleCloseModal}>
              Cancelar
            </DSButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
