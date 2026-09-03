import { getAccessToken } from "../../../auth/token";
import React, { useContext, useState, useEffect } from "react";
import { Tooltip } from "../../../components/LegacyUi";
import {
  FaFileAlt,
  FaHistory,
  FaDownload,
  FaFile,
  FaSpinner,
} from "react-icons/fa";
import { StyleContext } from "../../../reducers/style.reducer";
import {
  ActivityTemplate,
  DocumentConfig,
  DocumentTemplate,
} from "../../../api/types/schema";
import { IFormContext } from "@open-urbis/types";
import { DocumentEditor } from "../../workflows-schema/activities/documents/DocumentEditor";
import { DocumentPlateEditor } from "../../workflows-schema/activities/documents/DocumentPlateEditor";
import { DocumentCustomEditor } from "../../workflows-schema/activities/documents/DocumentCustomEditor";
import { StatusBadge } from "../components";
import { ApiClient } from "../../../api";
import {
  GenerateDocumentHttpDto,
  DocumentValue,
  DocumentStateEnum,
} from "../../../api/types/workflows.dto";
import { useSnackbar } from "../../../hooks/snackbar";
import { useParams, useLocation } from "react-router-dom";
import { StatusType } from "../components/StatusBadge";

const apiClient = new ApiClient({
  baseURL: import.meta.env.VITE_BACK_END_API || "",
  headers: {
    authorization: `Bearer ${getAccessToken() || ""}`,
  },
});

interface DocumentActivityProps {
  activity: ActivityTemplate & { template: DocumentTemplate };
  context: any;
  general: IFormContext;
  activeStep: number;
  value?: DocumentValue;
  onDocumentComplete?: (namespace: string, updatedValue: DocumentValue) => void;
}

export const DocumentActivity: React.FC<DocumentActivityProps> = ({
  activity,
  context,
  general,
  value,
  onDocumentComplete,
}) => {
  const styleContext = useContext(StyleContext);
  const snackbar = useSnackbar();
  const { id } = useParams();
  const location = useLocation();

  const [selectedDocument, setSelectedDocument] =
    useState<DocumentConfig | null>(null);
  const [isDownloading, setIsDownloading] = useState<Record<string, boolean>>(
    {}
  );

  useEffect(() => {
    // Reset selected document when activity changes
    setSelectedDocument(null);
  }, [activity.id]);

  useEffect(() => {
    if (value && value.documents) {
      const newDocumentStatus: Record<string, DocumentStateEnum> = {};

      activity.template.documents.forEach((doc) => {
        const documentInValue = value.documents[doc.id];

        if (documentInValue) {
          newDocumentStatus[doc.id] = documentInValue.state;
        } else {
          newDocumentStatus[doc.id] = DocumentStateEnum.PENDING;
        }
      });
    }
  }, [value, activity.template.documents]);

  const renderDocumentPreview = (doc: DocumentConfig) => {
    switch (doc.type) {
      case "document":
        return (
          <DocumentEditor
            config={doc.layout!}
            general={general}
            context={context}
            showPreview={true}
            onChange={() => {}}
          />
        );
      case "plate":
        return (
          <DocumentPlateEditor
            config={doc.layout!}
            general={general}
            context={context}
            showPreview={true}
            onChange={() => {}}
          />
        );
      case "custom":
        return (
          <DocumentCustomEditor
            doc={doc}
            value={doc}
            onChange={() => {}}
            showPreview={true}
          />
        );
      default:
        return <div>Tipo de documento não suportado</div>;
    }
  };

  const handleDownload = async (doc: DocumentConfig) => {
    try {
      setIsDownloading((prev) => ({ ...prev, [doc.id]: true }));

      let workflowId = id;

      if (!workflowId) {
        const params = new URLSearchParams(location.search);
        const idFromParams = params.get("id");
        if (idFromParams) {
          workflowId = idFromParams;
        }
      }

      if (!workflowId && context?.workflowId) {
        workflowId = context.workflowId;
      }

      if (!workflowId) {
        throw new Error("ID do workflow não encontrado");
      }

      console.log("Using workflow ID:", workflowId);

      const activityId = activity.id;
      if (!activityId) {
        throw new Error("ID da atividade não encontrado");
      }

      console.log("Using activity ID:", activityId);

      const requestData: GenerateDocumentHttpDto = {
        activityId,
        documentId: doc.id,
      };

      console.log("Sending request:", requestData);

      const response = await apiClient.workflows.generateDocument(
        workflowId,
        requestData
      );

      console.log("Document generation response:", response);

      if (response.content) {
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
        link.setAttribute("download", response.fileName || "document.pdf");
        link.setAttribute("target", "_blank");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (response.document) {
        window.open(response.document, "_blank");
      } else {
        throw new Error("Nenhum conteúdo ou URL do documento foi retornado");
      }

      // Fetch the updated workflow data to get the latest DocumentValue
      if (workflowId && onDocumentComplete) {
        try {
          const updatedWorkflow = await apiClient.workflows.findOne(workflowId);
          
          // Find the document activity in the updated workflow data
          if (updatedWorkflow && updatedWorkflow.value) {
            const documentValue = updatedWorkflow.value[activity.namespace] as DocumentValue;
            
            if (documentValue) {
              // Update the context with the new document value
              onDocumentComplete(activity.namespace, documentValue);
            }
          }
        } catch (error) {
          console.error("Error fetching updated workflow data:", error);
        }
      }

      snackbar.success("Documento gerado com sucesso e aberto em uma nova aba");
    } catch (error) {
      console.error("Erro ao baixar documento:", error);

      if (error instanceof Error) {
        snackbar.error(error.message);
      } else {
        snackbar.error("Ocorreu um erro ao gerar o documento");
      }
    } finally {
      setIsDownloading((prev) => ({ ...prev, [doc.id]: false }));
    }
  };

  const getDocumentStatusLabel = (docId: string) => {
    if (value?.documents && value.documents[docId]) {
      const doc = value.documents[docId];
      switch (doc.state) {
        case DocumentStateEnum.VALID:
          return "Válido";
        case DocumentStateEnum.UPDATED:
          return "Atualizado";
        case DocumentStateEnum.CANCELLED:
          return "Cancelado";
        case DocumentStateEnum.EXPIRED:
          return "Expirado";
        case DocumentStateEnum.REVOKED:
          return "Revogado";
        default:
          return "Pendente";
      }
    }

    return "Pendente";
  };

  const getDocumentStatusType = (docId: string): StatusType => {
    const mapping: Record<DocumentStateEnum, StatusType> = {
      [DocumentStateEnum.PENDING]: "warning",
      [DocumentStateEnum.VALID]: "success",
      [DocumentStateEnum.UPDATED]: "success",
      [DocumentStateEnum.CANCELLED]: "error",
      [DocumentStateEnum.EXPIRED]: "error",
      [DocumentStateEnum.REVOKED]: "error",
    };

    if (value?.documents && value.documents[docId]) {
      return mapping[value.documents[docId].state];
    }

    return "warning";
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="w-full">
        <div className="flex items-center space-x-2 mb-3 px-3">
          <FaHistory size={14} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-500">
            Documentos do Protocolo
          </span>
        </div>

        <div className="flex flex-col space-y-2">
          {activity.template.documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <FaFileAlt size={32} className="mb-4 opacity-50" />
              <p
                className="text-sm text-center mb-2"
                style={{ color: styleContext.state.textColor }}
              >
                Nenhum documento encontrado
              </p>
              <p
                className="text-xs text-center"
                style={{ color: styleContext.state.textColor }}
              >
                Não há documentos disponíveis nesta etapa
              </p>
            </div>
          ) : (
            activity.template.documents.map((doc) => {
              const isSelected = selectedDocument?.id === doc.id;
              const statusType = getDocumentStatusType(doc.id);

              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDocument(doc)}
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
                            ? "bg-blue-400"
                            : "bg-blue-900"
                    }`}
                  >
                    <FaFile size={16} className="text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{doc.label}</div>
                    <div className="text-sm opacity-75 truncate">
                      {getDocumentStatusLabel(doc.id)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {selectedDocument ? (
        <div className="w-full">
          <div className="p-6 rounded-lg border">
            <div className="flex items-center justify-between mb-6">
              <div className="space-y-1">
                <h2 className="text-xl font-bold">{selectedDocument.label}</h2>
                <p className="text-sm text-gray-500">
                  {selectedDocument.documentation}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <StatusBadge
                  status={getDocumentStatusType(selectedDocument.id)}
                  label={getDocumentStatusLabel(selectedDocument.id)}
                  size="md"
                />
                <Tooltip label="Baixar documento" placement="top">
                  <button
                    onClick={() => handleDownload(selectedDocument)}
                    disabled={isDownloading[selectedDocument.id]}
                    className={`p-2.5 rounded-lg transition-colors flex items-center space-x-2 ${
                      isDownloading[selectedDocument.id]
                        ? "opacity-70 cursor-not-allowed"
                        : ""
                    } ${
                      styleContext.state.buttonHoverColorWeight === "200"
                        ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                        : "bg-gray-800 hover:bg-gray-700 text-gray-200"
                    }`}
                  >
                    {isDownloading[selectedDocument.id] ? (
                      <FaSpinner size={16} className="animate-spin" />
                    ) : (
                      <FaDownload size={16} />
                    )}
                  </button>
                </Tooltip>
              </div>
            </div>

            <div>{renderDocumentPreview(selectedDocument)}</div>
          </div>
        </div>
      ) : (
        <div className="flex-1 pt-6 flex flex-col items-center justify-center h-full text-gray-500">
          <FaFileAlt size={48} className="mb-4 opacity-50" />
          <p
            className="text-xl font-medium mb-2"
            style={{ color: styleContext.state.textColor }}
          >
            Nenhum documento selecionado
          </p>
          <p
            className="text-sm"
            style={{ color: styleContext.state.textColor }}
          >
            Selecione um documento da lista acima para visualizar
          </p>
        </div>
      )}
    </div>
  );
};
