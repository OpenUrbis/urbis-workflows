import React, { useContext, useState, useEffect } from "react";
import { Tooltip } from "@chakra-ui/react";
import {
  FaFileInvoiceDollar,
  FaHistory,
  FaDownload,
  FaMoneyBill,
  FaSpinner,
} from "react-icons/fa";
import { StyleContext } from "../../../reducers/style.reducer";
import {
  ActivityTemplate,
  TaxConfig,
  TaxTemplate,
} from "../../../api/types/schema";
import { IFormContext } from "@open-urbis/types";
import { BillingDocumentPreview } from "../../workflows-schema/activities/taxes/BillingDocumentPreview";
import { StatusBadge } from "../components";
import { StatusType } from "../components/StatusBadge";
import { ApiClient } from "../../../api";
import {
  GenerateTaxHttpDto,
  TaxStateEnum,
  TaxValue,
} from "../../../api/types/workflows.dto";
import { useSnackbar } from "../../../hooks/snackbar";
import { useParams, useLocation } from "react-router-dom";

const apiClient = new ApiClient({
  baseURL: process.env.REACT_APP_BACK_END_API || "",
  headers: {
    authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  },
});

interface TaxActivityProps {
  activity: ActivityTemplate & { template: TaxTemplate };
  context: any;
  general: IFormContext;
  activeStep: number;
  value?: TaxValue;
  onTaxComplete?: (namespace: string, updatedValue: TaxValue) => void;
}

export const TaxActivity: React.FC<TaxActivityProps> = ({
  activity,
  context,
  general,
  value,
  onTaxComplete,
}) => {
  const styleContext = useContext(StyleContext);
  const snackbar = useSnackbar();
  const { id } = useParams();
  const location = useLocation();

  const [selectedTax, setSelectedTax] = useState<TaxConfig | null>(null);
  const [isDownloading, setIsDownloading] = useState<Record<string, boolean>>(
    {}
  );
  const [taxStatus, setTaxStatus] = useState<Record<string, TaxStateEnum>>({});

  // Reset selected tax when activity changes
  useEffect(() => {
    setSelectedTax(null);
  }, [activity.id]);

  // Initialize tax status based on value prop
  useEffect(() => {
    if (value && value.taxes) {
      const newTaxStatus: Record<string, TaxStateEnum> = {};

      // Set initial status for all taxes
      activity.template.taxes.forEach((tax) => {
        const taxInValue = value.taxes[tax.id];

        if (taxInValue) {
          // Tax exists in the value
          newTaxStatus[tax.id] = taxInValue.state;
        } else {
          // Tax doesn't exist in the value yet
          newTaxStatus[tax.id] = TaxStateEnum.PENDING;
        }
      });

      setTaxStatus(newTaxStatus);
    } else {
      // If no value is provided, set all taxes to PENDING
      const defaultStatus: Record<string, TaxStateEnum> = {};
      activity.template.taxes.forEach((tax) => {
        defaultStatus[tax.id] = TaxStateEnum.PENDING;
      });
      setTaxStatus(defaultStatus);
    }
  }, [value, activity.template.taxes]);

  const getPaymentStatus = (taxId: string): TaxStateEnum => {
    // Check if tax exists in value
    if (value?.taxes && value.taxes[taxId]) {
      return value.taxes[taxId].state;
    }

    // Use local state if tax not in value
    return taxStatus[taxId] || TaxStateEnum.PENDING;
  };

  const getStatusBadge = (taxId: string) => {
    const status = getPaymentStatus(taxId);
    return (
      <StatusBadge
        status={getTaxStatusType(status)}
        label={getTaxStatusLabel(status)}
        size="md"
      />
    );
  };

  // Helper function to get tax status label
  const getTaxStatusLabel = (status: TaxStateEnum): string => {
    switch (status) {
      case TaxStateEnum.PAID:
        return "Pago";
      case TaxStateEnum.OVERDUE:
        return "Vencido";
      case TaxStateEnum.CANCELLED:
        return "Cancelado";
      case TaxStateEnum.PENDING:
      default:
        return "Pendente";
    }
  };

  // Helper function to get tax status type for StatusBadge
  const getTaxStatusType = (status: TaxStateEnum): StatusType => {
    switch (status) {
      case TaxStateEnum.PAID:
        return "success";
      case TaxStateEnum.OVERDUE:
      case TaxStateEnum.CANCELLED:
        return "error";
      case TaxStateEnum.PENDING:
      default:
        return "warning";
    }
  };

  const handleDownload = async (tax: TaxConfig) => {
    try {
      // Set loading state for this specific tax
      setIsDownloading((prev) => ({ ...prev, [tax.id]: true }));

      // Get workflow ID from URL params
      let workflowId = id;

      // If not in URL params, try to get from URL search params
      if (!workflowId) {
        const params = new URLSearchParams(location.search);
        const idFromParams = params.get("id");
        if (idFromParams) {
          workflowId = idFromParams;
        }
      }

      // If still not found, try context
      if (!workflowId && context?.workflowId) {
        workflowId = context.workflowId;
      }

      if (!workflowId) {
        throw new Error("ID do workflow não encontrado");
      }

      console.log("Using workflow ID:", workflowId);

      // Get activity ID
      const activityId = activity.id;
      if (!activityId) {
        throw new Error("ID da atividade não encontrado");
      }

      console.log("Using activity ID:", activityId);

      // Prepare request data
      const requestData: GenerateTaxHttpDto = {
        activityId,
        taxId: tax.id,
      };

      console.log("Sending request:", requestData);

      // Call the API to generate the tax document
      const response = await apiClient.workflows.generateTax(
        workflowId,
        requestData
      );

      console.log("Tax generation response:", response);

      // Update tax status to PAID (assuming successful generation means payment)
      setTaxStatus((prev) => ({ ...prev, [tax.id]: TaxStateEnum.PAID }));

      // Open the document URL in a new tab
      if (response.content) {
        // If content is provided directly (base64), create a blob and download
        const byteCharacters = atob(response.content);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/pdf" });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", response.fileName || "tax.pdf");
        link.setAttribute("target", "_blank");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (response.document) {
        // If a URL is provided, open it in a new tab
        window.open(response.document, "_blank");
      } else {
        throw new Error("Nenhum conteúdo ou URL do documento foi retornado");
      }

      // Fetch the updated workflow data to get the latest TaxValue
      if (workflowId && onTaxComplete) {
        try {
          const updatedWorkflow = await apiClient.workflows.findOne(workflowId);
          
          // Find the tax activity in the updated workflow data
          if (updatedWorkflow && updatedWorkflow.value) {
            const taxValue = updatedWorkflow.value[activity.namespace] as TaxValue;
            
            if (taxValue) {
              // Update the context with the new tax value
              onTaxComplete(activity.namespace, taxValue);
            }
          }
        } catch (error) {
          console.error("Error fetching updated workflow data:", error);
        }
      }

      snackbar.success(
        "Documento de cobrança gerado com sucesso e aberto em uma nova aba"
      );
    } catch (error) {
      console.error("Erro ao baixar documento de cobrança:", error);

      if (error instanceof Error) {
        snackbar.error(error.message);
      } else {
        snackbar.error("Ocorreu um erro ao gerar o documento de cobrança");
      }
    } finally {
      setIsDownloading((prev) => ({ ...prev, [tax.id]: false }));
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      {/* Taxes Sidebar */}
      <div className="w-full">
        <div className="flex items-center space-x-2 mb-3 px-3">
          <FaHistory size={14} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-500">
            Documentos de Cobrança
          </span>
        </div>

        <div className="flex flex-col space-y-2">
          {activity.template.taxes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <FaFileInvoiceDollar size={32} className="mb-4 opacity-50" />
              <p
                className="text-sm text-center mb-2"
                style={{ color: styleContext.state.textColor }}
              >
                Nenhuma cobrança encontrada
              </p>
              <p
                className="text-xs text-center"
                style={{ color: styleContext.state.textColor }}
              >
                Não há cobranças disponíveis nesta etapa
              </p>
            </div>
          ) : (
            activity.template.taxes.map((tax) => {
              const isSelected = selectedTax?.id === tax.id;
              const status = getPaymentStatus(tax.id);
              const statusType = getTaxStatusType(status);

              return (
                <div
                  key={tax.id}
                  onClick={() => setSelectedTax(tax)}
                  className={`flex items-center p-4 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? styleContext.state.buttonHoverColorWeight === "200"
                        ? "bg-gray-200 text-gray-800"
                        : "bg-gray-700 text-gray-200"
                      : styleContext.state.buttonHoverColorWeight === "200"
                        ? "bg-gray-50 hover:bg-gray-100"
                        : "bg-gray-900 hover:bg-gray-800"
                  }`}
                >
                  <div
                    className={`w-10 h-10 flex items-center justify-center rounded-lg mr-4 ${
                      statusType === "success"
                        ? styleContext.state.buttonHoverColorWeight === "200"
                          ? "bg-green-400"
                          : "bg-green-700"
                        : statusType === "error"
                          ? styleContext.state.buttonHoverColorWeight === "200"
                            ? "bg-red-400"
                            : "bg-red-700"
                          : styleContext.state.buttonHoverColorWeight === "200"
                            ? "bg-yellow-400"
                            : "bg-yellow-700"
                    }`}
                  >
                    <FaMoneyBill size={16} className="text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{tax.label}</div>
                    <div className="text-sm opacity-75 truncate">
                      {getTaxStatusLabel(status)}
                    </div>
                  </div>

                  <div className="ml-2">{getStatusBadge(tax.id)}</div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {selectedTax ? (
        <div className="w-full">
          <div className="p-6 rounded-lg border">
            <div className="flex items-center justify-between mb-6">
              <div className="space-y-1">
                <h2 className="text-xl font-bold">{selectedTax.label}</h2>
                <p className="text-sm text-gray-500">
                  {selectedTax.documentation}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusBadge(selectedTax.id)}
                <Tooltip label="Baixar boleto" placement="top">
                  <button
                    onClick={() => handleDownload(selectedTax)}
                    disabled={isDownloading[selectedTax.id]}
                    className={`p-2.5 rounded-lg transition-colors flex items-center space-x-2 ${
                      isDownloading[selectedTax.id]
                        ? "opacity-70 cursor-not-allowed"
                        : ""
                    } ${
                      styleContext.state.buttonHoverColorWeight === "200"
                        ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                        : "bg-gray-800 hover:bg-gray-700 text-gray-200"
                    }`}
                  >
                    {isDownloading[selectedTax.id] ? (
                      <FaSpinner size={16} className="animate-spin" />
                    ) : (
                      <FaDownload size={16} />
                    )}
                  </button>
                </Tooltip>
              </div>
            </div>

            <div>
              <BillingDocumentPreview
                tax={selectedTax}
                styleContext={styleContext}
                context={context}
                general={general}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 pt-6 flex flex-col items-center justify-center h-full text-gray-500">
          <FaFileInvoiceDollar size={48} className="mb-4 opacity-50" />
          <p
            className="text-xl font-medium mb-2"
            style={{ color: styleContext.state.textColor }}
          >
            Nenhuma cobrança selecionada
          </p>
          <p
            className="text-sm"
            style={{ color: styleContext.state.textColor }}
          >
            Selecione uma cobrança da lista acima para visualizar
          </p>
        </div>
      )}
    </div>
  );
};
