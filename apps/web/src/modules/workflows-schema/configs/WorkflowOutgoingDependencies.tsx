import { getAccessToken } from "../../../auth/token";
import { useState, useContext, useEffect } from "react";
import { FaPlus, FaTrash, FaProjectDiagram } from "react-icons/fa";
import {
  FormControl,
  FormLabel,
  FormHelperText,
  IconButton,
  Tooltip,
  Spinner,
  Button,
  Menu,
  MenuButton,
} from "@chakra-ui/react";
import { IFormContext } from "@open-urbis/types";
import { Outgoing, ActivityTemplate } from "../../../api/types/schema";
import { WorkflowSchema } from "../../../api/types/workflows-schema.dto";
import { StyleContext } from "../../../reducers/style.reducer";
import { useSnackbar } from "../../../hooks/snackbar";
import { ApiClient } from "../../../api";
import {
  HotkeyContext,
  withNoModifiers,
} from "../../../reducers/hotkeys.reducer";
import { Input, Select, SL, Textarea } from "../../../components";
import { ActivityDependenciesSelector } from "../components/ActivityDependenciesSelector";

const apiClient = new ApiClient({
  baseURL: import.meta.env.VITE_BACK_END_API || "",
  headers: {
    authorization: `Bearer ${getAccessToken() || ""}`,
  },
});

export type WorkflowOutgoingDependenciesProps = {
  outgoing: Outgoing[];
  general: IFormContext;
  currentWorkflowId: string;
  onChange: (value: Outgoing[]) => void;
  activities?: ActivityTemplate[];
};

export const WorkflowOutgoingDependencies = ({
  outgoing,
  general,
  currentWorkflowId,
  onChange,
  activities = [],
}: WorkflowOutgoingDependenciesProps): JSX.Element => {
  const [selectedOutgoingId, setSelectedOutgoingId] = useState<string>("");
  const [availableWorkflows, setAvailableWorkflows] = useState<
    WorkflowSchema[]
  >([]);
  const [loading, setLoading] = useState(false);
  const styleContext = useContext(StyleContext);
  const hotkeyContext = useContext(HotkeyContext);
  const snackbar = useSnackbar();

  const fetchAvailableWorkflows = async () => {
    setLoading(true);
    try {
      const workflows = await apiClient.workflowsSchema.findAll();
      // Filter out the current workflow
      setAvailableWorkflows(
        workflows.filter((w) => w.id !== currentWorkflowId)
      );
    } catch (error) {
      console.error("Error fetching workflows:", error);
      snackbar.error("Erro ao carregar fluxos disponíveis");
    }
    setLoading(false);
  };

  const handleChangeOutgoingField = (field: string, newValue: any) => {
    const newOutgoing = outgoing.map((out) =>
      out.id === selectedOutgoingId ? { ...out, [field]: newValue } : out
    );
    onChange(newOutgoing);
  };

  const handleAddOutgoing = () => {
    const newOutgoing: Outgoing = {
      id: crypto.randomUUID(),
      label: "Nova Dependência",
      documentation: "Descrição da dependência",
      namespace: "outgoing.new",
      outgoingTo: "",
      dependsOn: [],
    };
    onChange([...outgoing, newOutgoing]);
    setSelectedOutgoingId(newOutgoing.id);
    fetchAvailableWorkflows();
  };

  const handleRemoveOutgoing = async (id: string) => {
    const response = await confirmation(
      "Tem certeza que deseja remover esta dependência?"
    );

    if (!response) {
      return;
    }

    setSelectedOutgoingId("");
    onChange(outgoing.filter((out) => out.id !== id));
  };

  useEffect(() => {
    hotkeyContext.dispatch({
      type: "SET_HOTKEY",
      payload: {
        N: withNoModifiers(() => {
          handleAddOutgoing();
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

  return (
    <div className="flex w-full">
      <div className="w-1/4 border-r pr-4">
        <h2
          className="text-xl font-bold mb-4"
          style={{ color: styleContext.state.textColor }}
        >
          Fluxos Subsequentes
        </h2>
        <div className="space-y-2">
          {outgoing.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <FaProjectDiagram size={32} className="mb-4 opacity-50" />
              <p
                className="text-sm text-center mb-2"
                style={{ color: styleContext.state.textColor }}
              >
                Nenhuma dependência cadastrada
              </p>
              <p
                className="text-xs text-center"
                style={{ color: styleContext.state.textColor }}
              >
                Adicione uma dependência usando o botão abaixo
              </p>
            </div>
          ) : (
            outgoing
              .sort((a, b) => a.label.localeCompare(b.label))
              .map((outgoing) => (
                <div
                  key={outgoing.id}
                  className={`p-3 border rounded cursor-pointer flex justify-between items-center group transition-colors duration-150`}
                  onClick={() => {
                    setSelectedOutgoingId(outgoing.id);
                    fetchAvailableWorkflows();
                  }}
                  style={{
                    backgroundColor:
                      outgoing.id === selectedOutgoingId
                        ? styleContext.state.buttonHoverColorWeight === "200"
                          ? "#E5E7EB"
                          : "#374151"
                        : styleContext.state.backgroundColor,
                    borderColor:
                      styleContext.state.buttonHoverColorWeight === "200"
                        ? "#E5E7EB"
                        : "#374151",
                    color: styleContext.state.textColor,
                  }}
                  onMouseEnter={(e) => {
                    if (selectedOutgoingId !== outgoing.id) {
                      e.currentTarget.style.backgroundColor =
                        styleContext.state.buttonHoverColorWeight === "200"
                          ? "#F3F4F6"
                          : "#4B5563";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedOutgoingId !== outgoing.id) {
                      e.currentTarget.style.backgroundColor =
                        styleContext.state.backgroundColor;
                    }
                  }}
                >
                  <div className="flex flex-col">
                    <div className="font-medium">
                      {outgoing.label || "Sem título"}
                    </div>
                    <div
                      className="text-sm"
                      style={{
                        color:
                          styleContext.state.buttonHoverColorWeight === "200"
                            ? "#6B7280"
                            : "#9CA3AF",
                      }}
                    >
                      {outgoing.namespace || "Sem namespace"}
                    </div>
                  </div>
                  <IconButton
                    aria-label="Remover dependência"
                    icon={<FaTrash />}
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveOutgoing(outgoing.id);
                    }}
                    style={{
                      backgroundColor:
                        styleContext.state.buttonHoverColorWeight === "200"
                          ? "#F3F4F6"
                          : "#4B5563",
                      color: styleContext.state.textColor,
                    }}
                  />
                </div>
              ))
          )}
        </div>
        <div className="mt-4">
          <Menu>
            <MenuButton
              as={Button}
              leftIcon={<FaPlus />}
              onClick={handleAddOutgoing}
              className="w-full px-4 py-2.5 rounded-lg flex items-center justify-center space-x-2"
              style={{
                backgroundColor:
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "#ca8a04"
                    : "#854d0e",
                color: "#ffffff",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "#a16207"
                    : "#713f12";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "#ca8a04"
                    : "#854d0e";
              }}
            >
              <div className="flex items-center justify-center space-x-2">
                <span>Dependência</span>
                <SL bg="yellow.600">N</SL>
              </div>
            </MenuButton>
          </Menu>
        </div>
      </div>

      <div className="w-3/4 pl-4">
        {selectedOutgoingId &&
          outgoing.find((out) => out.id === selectedOutgoingId) && (
            <div className="mb-8">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <FormControl>
                  <FormLabel style={{ color: styleContext.state.textColor }}>
                    ID
                  </FormLabel>
                  <Tooltip label="Identificador único da dependência">
                    <span>
                      <Input value={selectedOutgoingId} size="lg" readOnly />
                    </span>
                  </Tooltip>
                </FormControl>

                <FormControl>
                  <FormLabel style={{ color: styleContext.state.textColor }}>
                    Nome
                  </FormLabel>
                  <Input
                    value={
                      outgoing.find((out) => out.id === selectedOutgoingId)
                        ?.label || ""
                    }
                    onChange={(e) =>
                      handleChangeOutgoingField("label", e.target.value)
                    }
                    placeholder="Nome da dependência"
                    size="lg"
                  />
                  <FormHelperText
                    style={{ color: styleContext.state.textColor }}
                  >
                    Nome descritivo para identificar esta dependência
                  </FormHelperText>
                </FormControl>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <FormControl>
                  <FormLabel style={{ color: styleContext.state.textColor }}>
                    Namespace
                  </FormLabel>
                  <Tooltip label="Identificador único para acessar os dados desta dependência">
                    <span>
                      <Input
                        value={
                          outgoing.find((out) => out.id === selectedOutgoingId)
                            ?.namespace || ""
                        }
                        onChange={(e) =>
                          handleChangeOutgoingField("namespace", e.target.value)
                        }
                        placeholder="ex: outgoing.workflow"
                        size="lg"
                      />
                    </span>
                  </Tooltip>
                  <FormHelperText
                    style={{ color: styleContext.state.textColor }}
                  >
                    Identificador único para acessar os dados desta dependência
                  </FormHelperText>
                </FormControl>

                <FormControl>
                  <FormLabel style={{ color: styleContext.state.textColor }}>
                    Documentação
                  </FormLabel>
                  <Textarea
                    value={
                      outgoing.find((out) => out.id === selectedOutgoingId)
                        ?.documentation || ""
                    }
                    onChange={(e) =>
                      handleChangeOutgoingField("documentation", e.target.value)
                    }
                    placeholder="Descreva o propósito desta dependência"
                    size="lg"
                  />
                  <FormHelperText
                    style={{ color: styleContext.state.textColor }}
                  >
                    Documentação detalhada sobre esta dependência
                  </FormHelperText>
                </FormControl>
              </div>

              <div className="grid grid-cols-1 gap-6 mb-6">
                <FormControl>
                  <FormLabel style={{ color: styleContext.state.textColor }}>
                    Fluxo de Destino
                  </FormLabel>
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <Spinner size="sm" />
                      <span style={{ color: styleContext.state.textColor }}>
                        Carregando fluxos...
                      </span>
                    </div>
                  ) : (
                    <>
                      <Select
                        value={
                          outgoing.find((out) => out.id === selectedOutgoingId)
                            ?.outgoingTo || ""
                        }
                        onChange={(e) =>
                          handleChangeOutgoingField(
                            "outgoingTo",
                            e.target.value
                          )
                        }
                        placeholder="Selecione o fluxo de destino"
                        size="lg"
                      >
                        {availableWorkflows.map((workflow) => (
                          <option key={workflow.id} value={workflow.id}>
                            {workflow.label}
                          </option>
                        ))}
                      </Select>
                      <FormHelperText
                        style={{ color: styleContext.state.textColor }}
                      >
                        Selecione o fluxo que receberá os dados desta
                        dependência
                      </FormHelperText>
                    </>
                  )}
                </FormControl>
              </div>

              <div className="grid grid-cols-1 gap-6 mb-6">
                <ActivityDependenciesSelector
                  activities={activities}
                  selectedDependencies={
                    outgoing.find((out) => out.id === selectedOutgoingId)
                      ?.dependsOn || []
                  }
                  onChange={(dependencies) =>
                    handleChangeOutgoingField("dependsOn", dependencies)
                  }
                  styleContext={styleContext}
                  title="Dependências de Atividades"
                  helperText="Selecione as atividades que precisam ser concluídas antes que esta dependência seja habilitada"
                />
              </div>
            </div>
          )}
        {!selectedOutgoingId && (
          <div className="flex flex-col mt-6 items-center justify-center h-full text-gray-500">
            <FaProjectDiagram size={48} className="mb-4 opacity-50" />
            <p
              className="text-xl font-medium mb-2"
              style={{ color: styleContext.state.textColor }}
            >
              Nenhuma dependência selecionada
            </p>
            <p
              className="text-sm mb-6"
              style={{ color: styleContext.state.textColor }}
            >
              Selecione uma dependência da lista ao lado ou crie uma nova
            </p>
            <button
              onClick={handleAddOutgoing}
              className="px-4 py-2.5 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-150 font-medium"
              style={{
                backgroundColor:
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "#ca8a04"
                    : "#854d0e",
                color: "#ffffff",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "#a16207"
                    : "#713f12";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "#ca8a04"
                    : "#854d0e";
              }}
            >
              <div className="flex items-center justify-center space-x-2">
                <FaPlus size={14} />
                <span>Dependência</span>
                <SL bg="yellow.600">N</SL>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
