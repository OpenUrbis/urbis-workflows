import { getAccessToken } from "../../../auth/token";
import { useContext, useState, useEffect } from "react";
import { FieldTypeEnum, IField, IFormContext } from "@open-urbis/types";
import {
  Select as DSSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@open-urbis/map-ui";
import { FieldEditable } from "../form-engine/FieldEditable";
import { FaPlus, FaTrash, FaProjectDiagram } from "react-icons/fa";
import { Incoming } from "../../../api/types/schema";
import { StyleContext } from "../../../reducers";
import { ApiClient } from "../../../api";
import { WorkflowSchema } from "../../../api/types/workflows-schema.dto";
import { useSnackbar } from "../../../hooks/snackbar";
import {
  HotkeyContext,
  withNoModifiers,
} from "../../../reducers/hotkeys.reducer";
import {
  FormControl,
  FormHelperText,
  FormLabel,
  IconButton,
  Input,
  SL,
  Spinner,
  Textarea,
  Tooltip,
} from "../../../components";

const apiClient = new ApiClient({
  baseURL: import.meta.env.VITE_BACK_END_API || "",
  headers: {
    authorization: `Bearer ${getAccessToken() || ""}`,
  },
});

export type WorkflowDependenciesProps = {
  incoming: Incoming[];
  general: IFormContext;
  currentWorkflowId: string;
  onChange: (value: Incoming[]) => void;
};

export const WorkflowDependencies = ({
  incoming,
  general,
  currentWorkflowId,
  onChange,
}: WorkflowDependenciesProps): JSX.Element => {
  const [selectedIncomingId, setSelectedIncomingId] = useState<string>("");
  const [value, setValue] = useState<any>({});
  const [valid, setValid] = useState<any>({});
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

  const handleIncomingChange = (value: IField) => {
    const newIncoming = incoming.map((inc) =>
      inc.id === selectedIncomingId ? { ...inc, form: value } : inc
    );
    onChange(newIncoming);
  };

  const handleChangeIncomingField = (field: string, newValue: string) => {
    const newIncoming = incoming.map((inc) =>
      inc.id === selectedIncomingId ? { ...inc, [field]: newValue } : inc
    );
    onChange(newIncoming);
  };

  const handleAddIncoming = () => {
    const newIncoming: Incoming = {
      id: crypto.randomUUID(),
      label: "Nova Dependência",
      documentation: "Descrição da dependência",
      namespace: "incoming.new",
      dependsOn: "",
      form: {
        type: FieldTypeEnum.Block,
        key: "root",
        options: {
          hideEditMenu: true,
        },
        block: [],
        expressions: {},
      },
    };
    onChange([...incoming, newIncoming]);
    setSelectedIncomingId(newIncoming.id);
    fetchAvailableWorkflows();
  };

  const handleRemoveIncoming = async (id: string) => {
    const response = await confirmation(
      "Tem certeza que deseja remover esta dependência?"
    );

    if (!response) {
      return;
    }

    setSelectedIncomingId("");
    onChange(incoming.filter((inc) => inc.id !== id));
  };

  useEffect(() => {
    hotkeyContext.dispatch({
      type: "SET_HOTKEY",
      payload: {
        N: withNoModifiers(() => {
          handleAddIncoming();
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
          Pré-requisitos
        </h2>
        <div className="space-y-2">
          {incoming.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <FaProjectDiagram
                size={32}
                className="mb-4 opacity-50"
                style={{ transform: "scaleX(-1)" }}
              />
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
            incoming
              .sort((a, b) => a.label.localeCompare(b.label))
              .map((incoming) => (
                <div
                  key={incoming.id}
                  className={`p-3 border rounded cursor-pointer flex justify-between items-center group transition-colors duration-150`}
                  onClick={() => {
                    setSelectedIncomingId(incoming.id);
                    fetchAvailableWorkflows();
                  }}
                  style={{
                    backgroundColor:
                      incoming.id === selectedIncomingId
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
                    if (selectedIncomingId !== incoming.id) {
                      e.currentTarget.style.backgroundColor =
                        styleContext.state.buttonHoverColorWeight === "200"
                          ? "#F3F4F6"
                          : "#4B5563";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedIncomingId !== incoming.id) {
                      e.currentTarget.style.backgroundColor =
                        styleContext.state.backgroundColor;
                    }
                  }}
                >
                  <div className="flex flex-col">
                    <div className="font-medium">
                      {incoming.label || "Sem título"}
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
                      {incoming.namespace || "Sem namespace"}
                    </div>
                  </div>
                  <IconButton
                    aria-label="Remover dependência"
                    icon={<FaTrash />}
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveIncoming(incoming.id);
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
          <button
            onClick={handleAddIncoming}
            className="h-11 w-full rounded-xl px-4 font-semibold shadow-sm inline-flex items-center justify-center gap-2"
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
            <FaPlus size={14} />
            <span>Dependência</span>
            <SL bg="yellow.600">N</SL>
          </button>
        </div>
      </div>

      <div className="w-3/4 pl-4">
        {selectedIncomingId &&
          incoming.find((inc) => inc.id === selectedIncomingId) && (
            <div className="mb-8">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <FormControl>
                  <FormLabel style={{ color: styleContext.state.textColor }}>
                    ID
                  </FormLabel>
                  <Tooltip label="Identificador único da dependência">
                    <span>
                      <Input value={selectedIncomingId} size="lg" readOnly />
                    </span>
                  </Tooltip>
                  <FormHelperText
                    style={{ color: styleContext.state.textColor }}
                  >
                    Identificador único para esta dependência
                  </FormHelperText>
                </FormControl>

                <FormControl>
                  <FormLabel style={{ color: styleContext.state.textColor }}>
                    Nome
                  </FormLabel>
                  <Input
                    value={
                      incoming.find((inc) => inc.id === selectedIncomingId)
                        ?.label || ""
                    }
                    onChange={(e) =>
                      handleChangeIncomingField("label", e.target.value)
                    }
                    placeholder="Ex: Cadastro de Empresa"
                    size="lg"
                  />
                  <FormHelperText
                    style={{ color: styleContext.state.textColor }}
                  >
                    Nome descritivo para esta dependência
                  </FormHelperText>
                </FormControl>

                <FormControl>
                  <FormLabel style={{ color: styleContext.state.textColor }}>
                    Namespace
                  </FormLabel>
                  <Input
                    value={
                      incoming.find((inc) => inc.id === selectedIncomingId)
                        ?.namespace || ""
                    }
                    onChange={(e) =>
                      handleChangeIncomingField("namespace", e.target.value)
                    }
                    placeholder="Ex: incoming.company"
                    size="lg"
                  />
                  <FormHelperText
                    style={{ color: styleContext.state.textColor }}
                  >
                    Identificador único para esta dependência
                  </FormHelperText>
                </FormControl>

                <FormControl>
                  <FormLabel style={{ color: styleContext.state.textColor }}>
                    Documentação
                  </FormLabel>
                  <Textarea
                    value={
                      incoming.find((inc) => inc.id === selectedIncomingId)
                        ?.documentation || ""
                    }
                    onChange={(e: any) =>
                      handleChangeIncomingField("documentation", e.target.value)
                    }
                    placeholder="Descreva o propósito desta dependência"
                    size="lg"
                  />
                  <FormHelperText
                    style={{ color: styleContext.state.textColor }}
                  >
                    Descrição detalhada do propósito desta dependência
                  </FormHelperText>
                </FormControl>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <FormControl>
                  <FormLabel style={{ color: styleContext.state.textColor }}>
                    Depende de
                  </FormLabel>
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <Spinner size="sm" />
                      <span>Carregando fluxos...</span>
                    </div>
                  ) : (
                    <DSSelect
                      value={
                        incoming.find((inc) => inc.id === selectedIncomingId)
                          ?.dependsOn || ""
                      }
                      onValueChange={(value) =>
                        handleChangeIncomingField(
                          "dependsOn",
                          value === "__none__" ? "" : value
                        )
                      }
                    >
                      <SelectTrigger className="h-11 w-full">
                        <SelectValue placeholder="Selecione um fluxo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Selecione um fluxo</SelectItem>
                        {availableWorkflows.map((workflow) => (
                          <SelectItem key={workflow.id} value={workflow.id}>
                            {workflow.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </DSSelect>
                  )}
                  <FormHelperText
                    className="mb-6"
                    style={{ color: styleContext.state.textColor }}
                  >
                    Selecione o fluxo que deve ser concluído antes deste
                  </FormHelperText>
                </FormControl>
              </div>

              <div className="border-t pt-6">
                <div
                  className="font-medium mb-4"
                  style={{ color: styleContext.state.textColor }}
                >
                  Campos do Formulário
                </div>
                {incoming.find((inc) => inc.id === selectedIncomingId)
                  ?.form && (
                  <FieldEditable
                    context={value}
                    validContext={valid}
                    general={general}
                    field={
                      incoming.find((inc) => inc.id === selectedIncomingId)!
                        .form!
                    }
                    value={value}
                    valid={valid}
                    onChange={setValue}
                    onValidChange={setValid}
                    onConfigChange={handleIncomingChange}
                    onRemove={() => {}}
                  />
                )}
              </div>
            </div>
          )}
        {!selectedIncomingId && (
          <div className="flex flex-col mt-6 items-center justify-center h-full text-gray-500">
            <FaProjectDiagram
              size={48}
              className="mb-4 opacity-50"
              style={{ transform: "scaleX(-1)" }}
            />
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
              onClick={handleAddIncoming}
              className="h-11 rounded-xl px-4 shadow-sm inline-flex items-center justify-center gap-2 transition-colors duration-150 font-semibold"
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
