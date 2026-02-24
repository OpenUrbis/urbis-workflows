import { Spinner, Badge, Tooltip } from "@chakra-ui/react";
import { IFormContext } from "@open-urbis/types";
import { useState, useEffect } from "react";
import { FaLink, FaExternalLinkAlt, FaUnlink, FaPlus } from "react-icons/fa";
import { Incoming } from "../../../api/types/schema";
import { useSnackbar } from "../../../hooks/snackbar";
import { Field } from "../../workflows-schema";
import { FieldView } from "../../workflows-schema/form-engine/FieldView";
import { ApiClient } from "../../../api";
import { useLocation, useNavigate } from "react-router-dom";
import { Input } from "../../../components";

export const IncomingActivity: React.FC<{
  selected?: Incoming;
  value?: any;
  general: IFormContext;
  onChange: (value: any) => void;
  apiClient: ApiClient;
  styleContext: any;
}> = ({ selected, value, general, onChange, apiClient, styleContext }) => {
  const [workflowId, setWorkflowId] = useState("");
  const [workflowData, setWorkflowData] = useState<any>(value ?? null);
  const [valid, setValid] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const snackbar = useSnackbar();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if there's a 'from' parameter in the URL
    const params = new URLSearchParams(location.search);
    const fromWorkflowId = params.get("from");

    if (fromWorkflowId && !value?.$metadata?.workflowId) {
      // If 'from' parameter exists and we don't already have a workflow ID set
      setWorkflowId(fromWorkflowId);
      fetchWorkflowData(fromWorkflowId);

      // Remove the 'from' parameter from the URL
      params.delete("from");
      const newSearch = params.toString();
      const newPath = location.pathname + (newSearch ? `?${newSearch}` : "");

      // Update the URL without causing a page reload
      navigate(newPath, { replace: true });
    } else if (value?.$metadata?.workflowId) {
      setWorkflowId(value.$metadata.workflowId);
      // Always fetch the complete workflow data to ensure we have the latest data
      fetchWorkflowData(value.$metadata.workflowId);
    } else {
      // Reset states when there's no workflow ID
      setWorkflowData(null);
      setWorkflowId("");
      setError(null);
    }
  }, [selected, value?.$metadata?.workflowId]);

  const fetchWorkflowData = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.workflows.findOne(id);
      setWorkflowData(response);
      onChange({
        ...(value ?? {}),
        $metadata: {
          ...(value?.$metadata ?? {}),
          workflowId: response.id,
          label: response.label,
        },
      });
    } catch (error) {
      console.error("Error fetching workflow:", error);
      setError(
        "Protocolo não encontrado ou você não tem permissão para acessá-lo"
      );
      snackbar.error("Erro ao carregar protocolo");
    }
    setLoading(false);
  };

  const handleWorkflowIdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (workflowId) {
      fetchWorkflowData(workflowId);
    }
  };

  const handleClear = () => {
    setWorkflowData(null);
    setWorkflowId("");
    setError(null);
    onChange(undefined);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!value?.$metadata ? (
        <form onSubmit={handleWorkflowIdSubmit} className="space-y-6">
          <div className="flex flex-col space-y-2">
            <label
              htmlFor="workflowId"
              className=""
              style={{ color: styleContext.state.textColor }}
            >
              Número do Protocolo
            </label>
            <div className="flex space-x-2">
              <Input
                id="workflowId"
                type="text"
                size="lg"
                value={workflowId}
                onChange={(e) => {
                  setWorkflowId(e.target.value);
                  setError(null);
                }}
                placeholder="Digite o número do protocolo"
              />
              <button
                type="submit"
                disabled={!workflowId}
                className={`px-4 py-2 rounded-md text-white font-medium transition-colors ${
                  "bg-primary hover:bg-primary/90 text-primary-foreground"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Buscar
              </button>
            </div>
            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
            {selected?.dependsOn && (
              <div className="flex flex-col space-y-4 pt-2">
                <p
                  className="text-sm"
                  style={{ color: styleContext.state.textColor }}
                >
                  Não possui um protocolo? Crie um novo fluxo
                </p>
                <div>
                  <a
                    href={`/workflows/${selected.dependsOn}/create?stage=${general.$data?.stage || "development"}`}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-colors ${
                      styleContext.state.buttonHoverColorWeight === "200"
                        ? "bg-blue-100 hover:bg-blue-200 text-blue-800"
                        : "bg-blue-800 hover:bg-blue-700 text-blue-100"
                    }`}
                  >
                    <FaPlus size={12} />
                    <span className="text-sm font-medium">Criar</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col space-y-6">
            {/* Protocol Information */}
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div
                  className={`p-3 rounded-lg ${
                    styleContext.state.buttonHoverColorWeight === "200"
                      ? "bg-blue-100"
                      : "bg-blue-900"
                  }`}
                >
                  <FaLink
                    size={20}
                    className={
                      styleContext.state.buttonHoverColorWeight === "200"
                        ? "text-blue-700"
                        : "text-blue-100"
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Badge colorScheme="blue" fontSize="sm">
                    {value.$metadata?.workflowId}
                  </Badge>
                  <h3
                    className="font-medium mt-2"
                    style={{ color: styleContext.state.textColor }}
                  >
                    {value.$metadata?.label}
                  </h3>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Tooltip label="Visualizar protocolo" placement="top">
                  <button
                    onClick={() =>
                      window.open(
                        `/workflows/${value.$metadata?.workflowId}`,
                        "_blank"
                      )
                    }
                    className={`p-2.5 rounded-lg transition-colors flex items-center space-x-2 ${
                      styleContext.state.buttonHoverColorWeight === "200"
                        ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                        : "bg-gray-800 hover:bg-gray-700 text-gray-200"
                    }`}
                  >
                    <FaExternalLinkAlt size={14} />
                    <span className="text-sm font-medium">Visualizar</span>
                  </button>
                </Tooltip>
                {general.$state === "create" && (
                  <Tooltip label="Remover vínculo" placement="top">
                    <button
                      onClick={handleClear}
                      className={`p-2.5 rounded-lg transition-colors flex items-center space-x-2 ${
                        styleContext.state.buttonHoverColorWeight === "200"
                          ? "bg-red-100 hover:bg-red-200 text-red-700"
                          : "bg-red-900 hover:bg-red-800 text-red-200"
                      }`}
                    >
                      <FaUnlink size={14} />
                      <span className="text-sm font-medium">Desvincular</span>
                    </button>
                  </Tooltip>
                )}
              </div>
            </div>
            {/* Additional Information Form */}
            {selected?.form &&
              workflowData?.value &&
              (general.$state === "create" ? (
                <Field
                  field={selected.form}
                  value={value}
                  valid={valid}
                  context={value}
                  validContext={{}}
                  general={{
                    ...general,
                    $data: {
                      ...general.$data,
                      [selected.namespace]: workflowData.value,
                    },
                  }}
                  onChange={(formValue) => {
                    if (onChange) {
                      onChange({
                        ...value,
                        ...formValue,
                      });
                    }
                  }}
                  onValidChange={(valid) => {
                    setValid(valid);
                  }}
                />
              ) : (
                <FieldView
                  field={selected.form}
                  context={value ?? {}}
                  value={value ?? {}}
                  general={{
                    ...general,
                    $data: {
                      ...general.$data,
                      [selected.namespace]: workflowData.value,
                    },
                  }}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
