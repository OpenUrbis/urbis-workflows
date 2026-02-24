import React, { useContext, useEffect, useState } from "react";
import { Spinner } from "@chakra-ui/react";
import {
  FaSignature,
  FaHistory,
  FaUserCircle,
  FaFileSignature,
  FaArrowRight,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
} from "react-icons/fa";
import { Field } from "../../workflows-schema/form-engine/Field";
import { StyleContext } from "../../../reducers/style.reducer";
import {
  ActivityTemplate,
  SignaturesTemplate,
  Incoming,
} from "../../../api/types/schema";
import { IField, IFormContext } from "@open-urbis/types";
import { ApiClient } from "../../../api";
import {
  SignatureStateEnum,
  SignatureValue,
} from "../../../api/types/workflows.dto";
import { UserApiResponse } from "../../../api/types/users.dto";
import { FieldView } from "../../workflows-schema/form-engine/FieldView";
import { StatusBadge } from "../components";
import { StatusType } from "../components/StatusBadge";
import { useSnackbar } from "../../../hooks/snackbar";

interface SignatureLink {
  from: string;
  by: string;
  to?: string;
  $metadata?: any;
}

interface SignatureCard {
  // Single signature data
  id: string;
  signatureTypeId: string;
  documentId: string;
  label: string;
  form: any;
  state: SignatureStateEnum;
  createdAt: Date;
  updatedAt?: Date;
  data: any;
  // Metadata fields that aren't sent to backend
  link: SignatureLink;
  userData?: UserApiResponse;
}

interface SignatureActivityProps {
  activity: ActivityTemplate & { template: SignaturesTemplate };
  context: any;
  general: IFormContext;
  activeStep: number;
  workflow: any;
  apiClient: ApiClient;
  value?: SignatureValue;
  onSignatureComplete?: (namespace: string, updatedValue: any) => void;
}

export const SignatureActivity: React.FC<SignatureActivityProps> = ({
  activity,
  context,
  general,
  activeStep,
  workflow,
  apiClient,
  value,
  onSignatureComplete,
}) => {
  const styleContext = useContext(StyleContext);
  const snackbar = useSnackbar();
  const [signatures, setSignatures] = useState<SignatureCard[]>([]);
  const [selectedSignature, setSelectedSignature] =
    useState<SignatureCard | null>(null);
  const [signatureForm, setSignatureForm] = useState<any>({});
  const [signatureValid, setSignatureValid] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [signingInProgress, setSigningInProgress] = useState<boolean>(false);

  const parseSignatureLinks = (
    block: IField[],
    model: any,
    links: SignatureLink[]
  ) => {
    if (!block) return;

    for (const field of block) {
      if (field.type === "link") {
        const value = model?.[field.key];
        links.push(value);
      } else if (field.type === "block" && Array.isArray(field.block)) {
        parseSignatureLinks(field.block, model?.[field.key], links);
      } else if (field.type === "preset" && Array.isArray(field.preset)) {
        parseSignatureLinks(field.preset, model?.[field.key], links);
      } else if (field.type === "array" && Array.isArray(field.block)) {
        const arrayValues = model?.[field.key] || [];
        arrayValues.forEach((item: any) => {
          parseSignatureLinks(field.block!, item, links);
        });
      }
    }
  };

  const fetchUserData = async (document: string): Promise<UserApiResponse> => {
    try {
      return await apiClient.users.getUserByDocument(document);
    } catch (error) {
      console.error(
        `Error fetching user data for document ${document}:`,
        error
      );
      throw error;
    }
  };

  const parseSignatureData = async (
    workflow: any,
    currentStep: number,
    context: any
  ): Promise<SignatureCard[]> => {
    const signatures: SignatureCard[] = [];
    const links: SignatureLink[] = [];

    // Parse previous activities and incoming data
    const previousActivities =
      workflow.schema?.activities?.slice(0, currentStep) || [];

    previousActivities.forEach((activity: ActivityTemplate) => {
      if ("form" in activity.template && activity.template.form) {
        parseSignatureLinks(
          activity.template.form.block || [],
          context[activity.namespace]?.form ?? {},
          links
        );
      }
    });

    const incomingData = workflow.schema?.incoming || [];
    incomingData.forEach((incoming: Incoming) => {
      if (incoming.form) {
        parseSignatureLinks(
          incoming.form.block || [],
          context[incoming.namespace],
          links
        );
      }
    });

    // Convert links to signature data and fetch user data
    for (const link of links) {
      const matchingSignature = activity.template.signatures.find(
        (sig) => sig.id === link.by
      );

      if (matchingSignature) {
        try {
          const userData = await fetchUserData(link.from);

          // Check if this signature exists in the value prop
          let signatureState = SignatureStateEnum.PENDING;
          let signatureData = {};
          let signatureForm = {};

          if (value && value.signatures) {
            // Find signature by iterating through the signatures record
            const existingSignature = Object.values(value.signatures).find(
              (sig) =>
                sig.signatureTypeId === link.by && sig.documentId === link.from
            );

            if (existingSignature) {
              signatureState = existingSignature.state;
              signatureData = existingSignature.form || {};
              signatureForm = existingSignature.form || {};
            }
          }

          signatures.push({
            id: link.by,
            signatureTypeId: "digital",
            documentId: link.from,
            label: userData?.name || link.from,
            form: signatureForm,
            state: signatureState,
            createdAt: new Date(),
            data: signatureData,
            link,
            userData,
          });
        } catch (error) {
          console.error(
            `Error processing signature for document ${link.from}:`,
            error
          );
        }
      }
    }

    return signatures;
  };

  useEffect(() => {
    const loadSignatures = async () => {
      setLoading(true);
      try {
        const parsedSignatures = await parseSignatureData(
          workflow,
          activeStep,
          context
        );
        setSignatures(parsedSignatures);
      } catch (error) {
        console.error("Error loading signatures:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSignatures();
  }, [workflow, activeStep, context, value]);

  const handleAcceptSignature = async () => {
    if (!selectedSignature || !workflow.id) return;

    setSigningInProgress(true);

    try {
      // Send only the form data, not the entire SignatureValue
      const response = await apiClient.workflows.sign(workflow.id, {
        activityId: activity.id,
        signatureTypeId: selectedSignature.id,
        form: signatureForm,
      });

      // Update local state
      setSignatures((prevSignatures) =>
        prevSignatures.map((sig) =>
          sig.link.from === selectedSignature.link.from
            ? {
                ...sig,
                state: SignatureStateEnum.SIGNED,
                form: signatureForm,
                data: signatureForm,
              }
            : sig
        )
      );

      snackbar.success("Assinatura realizada com sucesso");
      setSelectedSignature(null);
      setSignatureForm({});

      // Call the callback with the updated value
      if (onSignatureComplete && response.value) {
        onSignatureComplete(activity.namespace, response.value);
      }
    } catch (error) {
      console.error("Error signing document:", error);
      snackbar.error("Erro ao assinar documento. Por favor, tente novamente.");
    } finally {
      setSigningInProgress(false);
    }
  };

  const getSignatureForm = (signature: SignatureCard): IField => {
    const signatureTemplate = activity.template.signatures.find(
      (s) => s.id === signature.id
    );
    if (!signatureTemplate?.form) {
      throw new Error(`No form found for signature template ${signature.id}`);
    }
    return signatureTemplate.form;
  };

  const getSignatureStatus = (signature: SignatureCard): SignatureStateEnum => {
    // Check if this signature exists in the value prop
    if (value && value.signatures) {
      // Find signature by iterating through the signatures record
      const existingSignature = Object.values(value.signatures).find(
        (sig) =>
          sig.signatureTypeId === signature.signatureTypeId &&
          sig.documentId === signature.documentId
      );

      if (existingSignature) {
        return existingSignature.state;
      }
    }

    // Fall back to the local state
    return signature.state;
  };

  const getSignatureTemplateName = (signature: SignatureCard): string => {
    const template = activity.template.signatures.find(
      (s) => s.id === signature.id
    );
    return template?.label || "Assinatura Digital";
  };

  const getSignatureDocumentation = (signature: SignatureCard): string => {
    const template = activity.template.signatures.find(
      (s) => s.id === signature.id
    );
    return template?.documentation || "";
  };

  // Helper function to get signature status label
  const getSignatureStatusLabel = (status: SignatureStateEnum): string => {
    switch (status) {
      case SignatureStateEnum.SIGNED:
        return "Assinado";
      case SignatureStateEnum.REJECTED:
        return "Rejeitado";
      case SignatureStateEnum.PENDING:
      default:
        return "Pendente";
    }
  };

  // Helper function to get signature status type for StatusBadge
  const getSignatureStatusType = (status: SignatureStateEnum): StatusType => {
    switch (status) {
      case SignatureStateEnum.SIGNED:
        return "success";
      case SignatureStateEnum.REJECTED:
        return "error";
      case SignatureStateEnum.PENDING:
      default:
        return "warning";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const isCurrentUser = (signature: SignatureCard): boolean => {
    return signature.link.from === general.$user?.document;
  };

  const canEditSignature = (signature: SignatureCard): boolean => {
    return (
      isCurrentUser(signature) &&
      getSignatureStatus(signature) === SignatureStateEnum.PENDING
    );
  };

  return (
    <div className="flex space-x-6">
      {/* Signatures Sidebar */}
      <div className="w-80 flex-shrink-0">
        <div className="flex items-center space-x-2 mb-3 px-3">
          <FaHistory size={14} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-500">
            Assinaturas Necessárias
          </span>
        </div>

        <div className="flex flex-col space-y-2">
          {signatures.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <FaUserCircle size={32} className="mb-4 opacity-50" />
              <p
                className="text-sm text-center mb-2"
                style={{ color: styleContext.state.textColor }}
              >
                Nenhuma assinatura encontrada
              </p>
              <p
                className="text-xs text-center"
                style={{ color: styleContext.state.textColor }}
              >
                Não há assinaturas pendentes nesta etapa
              </p>
            </div>
          ) : (
            signatures.map((signature) => {
              const isSelected = selectedSignature?.id === signature.id;
              const status = getSignatureStatus(signature);
              const statusType = getSignatureStatusType(status);

              return (
                <div
                  key={`${signature.id}-${signature.documentId}-${signature.signatureTypeId}`}
                  onClick={() => {
                    setSignatureForm({
                      $data: signature.data,
                      $metadata: signature.link.$metadata,
                    });
                    setSelectedSignature(signature);
                  }}
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
                    {status === SignatureStateEnum.SIGNED ? (
                      <FaCheckCircle size={16} className="text-white" />
                    ) : status === SignatureStateEnum.REJECTED ? (
                      <FaTimesCircle size={16} className="text-white" />
                    ) : (
                      <FaArrowRight size={16} className="text-white" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {signature.userData?.name || signature.label}
                    </div>
                    <div className="text-sm opacity-75 truncate">
                      {getSignatureStatusLabel(status)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {selectedSignature ? (
        <div className="flex-1">
          <div className="p-6 rounded-lg border">
            <div className="flex items-center justify-between mb-6">
              <div className="space-y-1">
                <h2 className="text-xl font-bold">
                  {getSignatureTemplateName(selectedSignature)}
                </h2>
                <p className="text-sm text-gray-500">
                  {getSignatureDocumentation(selectedSignature)}
                </p>
              </div>
              <StatusBadge
                status={getSignatureStatusType(
                  getSignatureStatus(selectedSignature)
                )}
                label={getSignatureStatusLabel(
                  getSignatureStatus(selectedSignature)
                )}
                size="md"
              />
            </div>

            {canEditSignature(selectedSignature) ? (
              <>
                <Field
                  field={getSignatureForm(selectedSignature)}
                  context={signatureForm}
                  validContext={signatureValid}
                  general={general}
                  value={signatureForm}
                  valid={signatureValid}
                  onChange={(value) => {
                    setSignatureForm({
                      ...signatureForm,
                      ...value,
                    });
                  }}
                  onValidChange={setSignatureValid}
                />
                <div className="flex justify-end mt-6">
                  <button
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      "bg-primary hover:bg-primary/90 text-primary-foreground"
                    } ${
                      signingInProgress ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                    onClick={handleAcceptSignature}
                    disabled={signingInProgress}
                  >
                    <FaFileSignature size={16} />
                    <span className="font-medium">
                      {signingInProgress ? (
                        <div className="flex items-center space-x-2">
                          {"Assinado"}
                          <FaSpinner size={16} className="ml-2 animate-spin" />
                        </div>
                      ) : (
                        "Assinar"
                      )}
                    </span>
                  </button>
                </div>
              </>
            ) : (
              <>
                {getSignatureStatus(selectedSignature) ===
                SignatureStateEnum.PENDING ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <FaSpinner size={32} className="mb-4 opacity-50" />
                    <p
                      className="text-xl font-medium mb-2"
                      style={{ color: styleContext.state.textColor }}
                    >
                      Assinatura pendente
                    </p>
                    <p
                      className="text-sm text-center max-w-md"
                      style={{ color: styleContext.state.textColor }}
                    >
                      Aguardando assinatura de{" "}
                      {selectedSignature.userData?.name ||
                        selectedSignature.label}
                      . O conteúdo estará disponível após a assinatura ser
                      realizada.
                    </p>
                  </div>
                ) : (
                  <FieldView
                    field={getSignatureForm(selectedSignature)}
                    context={selectedSignature.data}
                    value={selectedSignature.data}
                    general={general}
                  />
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center h-full text-gray-500">
          <FaSignature size={48} className="mb-4 opacity-50" />
          <p
            className="text-xl font-medium mb-2"
            style={{ color: styleContext.state.textColor }}
          >
            Nenhuma assinatura selecionada
          </p>
          <p
            className="text-sm"
            style={{ color: styleContext.state.textColor }}
          >
            Selecione uma assinatura da lista ao lado para visualizar os
            detalhes
          </p>
        </div>
      )}
    </div>
  );
};
