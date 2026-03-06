import { getAccessToken } from "../../auth/token";
import React, { useEffect, useState, useContext } from "react";
import {
  Button as DSButton,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Tooltip as DSTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@open-urbis/map-ui";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { IFormContext } from "@open-urbis/types";
import { Field } from "../workflows-schema/form-engine/Field";
import { ApiClient } from "../../api";
import {
  WorkflowSchema,
  WorkflowStageEnum,
} from "../../api/types/workflows-schema.dto";
import {
  ActivityTemplate,
  ActivityTypeEnum,
  FormTemplate,
  Incoming,
  SignaturesTemplate,
  DocumentTemplate,
  TaxTemplate,
} from "../../api/types/schema";
import { ActivityStateEnum } from "../../api/types/workflows.dto";
import { StyleContext } from "../../reducers/style.reducer";
import {
  FaTimes,
  FaExclamationTriangle,
  FaTrash,
  FaClock,
  FaHistory,
  FaLink,
  FaShieldAlt,
} from "react-icons/fa";
import {
  loadCodeModules,
  loadConstantVariables,
  loadSignatureMetadata,
} from "../../utils/workflow-context";
import { useSnackbar } from "../../hooks/snackbar";
import { FieldView } from "../workflows-schema/form-engine/FieldView";
import { QRCodeSVG } from "qrcode.react";
import {
  ActivitiesList,
  IncomingActivity,
  IncomingList,
  OutgoingList,
  SignatureActivity,
  DocumentActivity,
  TaxActivity,
} from "./activities";
import { Spinner } from "../../components";
import { formatDate, formatId } from "./activities/common";
import { v4 as uuidv4 } from "uuid";
import { usePermissions } from "../../reducers/permission.context";

const apiClient = new ApiClient({
  baseURL: import.meta.env.VITE_BACK_END_API || "",
  headers: {
    authorization: `Bearer ${getAccessToken() || ""}`,
  },
});

const getTempWorkflowKey = (workflowId: string) =>
  `temp_workflow_state:${workflowId}`;
const getLastUpdateKey = (workflowId: string) =>
  `temp_workflow_last_update:${workflowId}`;

interface StoredWorkflow {
  data: any;
  timestamp: number;
}

export function Workflows(): JSX.Element {
  const { id } = useParams();
  const snackbar = useSnackbar();
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const styleContext = useContext(StyleContext);
  const {
    userIam,
    hasActivityAccess,
    loading: permissionsLoading,
  } = usePermissions();
  const isCreating = location.pathname.endsWith("/create");
  const highlightQuery = params.get("highlight") || undefined;
  const [showQRModal, setShowQRModal] = useState(false);
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  const [workflow, setWorkflow] = useState<WorkflowSchema | undefined>(
    undefined,
  );
  const [context, setContext] = useState<any>({});
  const [valid, setValid] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [selectedDescription, setSelectedDescription] = useState<{
    text: string;
    label: string;
  } | null>(null);
  const [general, setGeneral] = useState<IFormContext>({
    $data: {},
    $modules: {},
    $state: isCreating ? "create" : "view",
    $user: undefined,
    $variables: {},
    $tree: [],
  });
  const [isLocalDraft, setIsLocalDraft] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);
  const [showDependentWorkflows, setShowDependentWorkflows] = useState(false);
  const [selectedIncoming, setSelectedIncoming] = useState<
    Incoming | undefined
  >(undefined);
  const [incomingListOpen, setIncomingListOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [activeStep, setActiveStep] = useState(0);

  const fetchWorkflow = async () => {
    try {
      let response;
      if (isCreating) {
        // Fetch workflow schema for creation
        response = await apiClient.workflowsSchema.findOne(
          id as string,
          params.get("stage") as WorkflowStageEnum,
        );
        setWorkflow(response);

        if (response.schema?.incoming?.length > 0) {
          setSelectedIncoming(response.schema.incoming[0]);
        }

        await fetchSecondaryData(response);
      } else {
        // Fetch existing workflow
        response = await apiClient.workflows.findOne(id as string);
        // Set the context from the workflow's value
        setWorkflow(response);
        setContext(response.value || {});
        await fetchSecondaryData(response, response.value);
      }
    } catch (e) {
      console.error("Error fetching workflow:", e);
      snackbar.error("Erro ao carregar o fluxo");
    }
    setLoading(false);
  };

  const fetchSecondaryData = async (workflow: WorkflowSchema, value?: any) => {
    if (!workflow) return;

    try {
      const user = await apiClient.users.getProfile();
      const variables = await loadConstantVariables(
        workflow.schema?.constants ?? [],
        apiClient,
      );
      const modules = await loadCodeModules(
        workflow.schema?.code ?? [],
        apiClient,
      );
      const signatureMetadata = loadSignatureMetadata(
        workflow.schema?.activities ?? [],
      );

      setGeneral({
        $data: value ?? context,
        $modules: modules,
        $variables: variables,
        $user: user as any,
        $state: isCreating ? "create" : "view",
        $tree: {
          signatures: signatureMetadata,
        },
      });
    } catch (error) {
      console.error("Error fetching secondary data:", error);
    }
  };

  const updateCreatingContext = (
    namespace: string,
    value: any,
    activityType: ActivityTypeEnum,
  ) => {
    // Only allow context updates when creating a new workflow
    if (!isCreating) return;

    let newContext = undefined;

    if (activityType === ActivityTypeEnum.FORM) {
      // Always maintain the same structure for form data with proper metadata
      newContext = {
        ...context,
        [namespace]: {
          ...context[namespace],
          id: context[namespace]?.id || uuidv4(),
          state: ActivityStateEnum.CREATED,
          createdAt: context[namespace]?.createdAt || new Date(),
          createdBy: general.$user?.id || "unknown",
          form: value,
        },
      };
    } else {
      newContext = {
        ...context,
        [namespace]: value,
      };
    }

    setContext(newContext);

    // Save to localStorage if we have a workflow ID and we're creating
    if (id && isCreating) {
      try {
        const storageKey = getTempWorkflowKey(id);
        const lastUpdateKey = getLastUpdateKey(id);
        const storedData: StoredWorkflow = {
          data: newContext,
          timestamp: Date.now(),
        };
        localStorage.setItem(storageKey, JSON.stringify(storedData));
        localStorage.setItem(lastUpdateKey, Date.now().toString());
        setIsLocalDraft(true);
      } catch (error) {
        console.error("Error saving draft:", error);
        snackbar.error("Erro ao salvar rascunho");
      }
    }
  };

  const updateContext = (namespace: string, value: any) => {
    setContext((prevContext: any) => ({
      ...prevContext,
      [namespace]: value,
    }));
  };

  const checkForStoredDraft = (workflowId: string) => {
    // Only check for drafts when creating
    if (!isCreating) return false;

    const storageKey = getTempWorkflowKey(workflowId);
    const storedDataStr = localStorage.getItem(storageKey);

    if (storedDataStr) {
      try {
        const storedData: StoredWorkflow = JSON.parse(storedDataStr);
        if (storedData.data && Object.keys(storedData.data).length > 0) {
          setContext(storedData.data);
          setIsLocalDraft(true);
          return true;
        }
      } catch (error) {
        console.error("Error parsing stored draft:", error);
        // Remove invalid draft data
        localStorage.removeItem(storageKey);
        localStorage.removeItem(getLastUpdateKey(workflowId));
      }
    }
    return false;
  };

  const handleDiscardDraft = async () => {
    if (!id || !isCreating) return;

    const confirmed = await confirmation(
      "Tem certeza que deseja descartar todas as alterações locais não salvas?",
    );

    if (!confirmed) {
      return;
    }

    try {
      // Clear localStorage
      localStorage.removeItem(getTempWorkflowKey(id));
      localStorage.removeItem(getLastUpdateKey(id));
      setIsLocalDraft(false);

      // Reset context and refetch workflow
      setContext({});
      setValid({});
      setLoading(true);
      await fetchWorkflow();
    } catch (error) {
      console.error("Error discarding draft:", error);
      snackbar.error("Erro ao descartar rascunho");
    }
  };

  const handleProtocol = async () => {
    if (loading || !isCreating) return;

    // Check if current form is complete
    const currentActivity = workflow?.schema?.activities?.[activeStep];
    if (!currentActivity || !checkFormCompletion(currentActivity)) {
      snackbar.error("Por favor, complete todos os campos obrigatórios");
      return;
    }

    setLoading(true);

    try {
      const incomingData = workflow?.schema?.incoming?.reduce(
        (acc: any, incoming: Incoming) => {
          acc[incoming.namespace] = context[incoming.namespace];
          return acc;
        },
        {},
      );

      const response = await apiClient.workflows.create({
        workflowSchemaId: id as string,
        form: context[currentActivity.namespace].form,
        incoming: incomingData,
        stage: params.get("stage") as WorkflowStageEnum,
      });

      // Clear draft after successful submission
      if (id) {
        localStorage.removeItem(getTempWorkflowKey(id));
        localStorage.removeItem(getLastUpdateKey(id));
      }

      navigate(`/workflows/${response.id}`);
    } catch (error) {
      console.error("Error creating protocol:", error);
      snackbar.error("Erro ao criar protocolo");
      setLoading(false);
    }
  };

  // Add recursive function to check completion status
  const checkValidCompletion = (validObj: any): boolean => {
    if (!validObj) return false;

    // If we find a $complete key, return its value
    if (validObj.$complete !== undefined) {
      return validObj.$complete === true;
    }

    // If it's an object, recursively check all its values
    if (typeof validObj === "object") {
      return Object.values(validObj).some((value) =>
        checkValidCompletion(value),
      );
    }

    return false;
  };

  const checkFormCompletion = (activity: any) => {
    if (activity.type !== ActivityTypeEnum.FORM) return true;
    return checkValidCompletion(valid[activity.namespace]);
  };

  const handleStepChange = (newStep: number) => {
    setSelectedIncoming(undefined);
    setActiveStep(newStep);
  };

  const handleFormSubmit = async () => {
    if (loading) return;

    const currentActivity = workflow?.schema?.activities?.[activeStep];
    if (!currentActivity || currentActivity.type !== ActivityTypeEnum.FORM) {
      return;
    }

    // Check if current form is complete
    if (!checkFormCompletion(currentActivity)) {
      snackbar.error("Por favor, complete todos os campos obrigatórios");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiClient.workflows.form(id as string, {
        activityId: currentActivity.id,
        form: context[currentActivity.namespace].form,
      });

      // Update the context with the response
      const updatedContext = {
        ...context,
        [currentActivity.namespace]: response.value,
      };
      setContext(updatedContext);

      // Show success message
      snackbar.success("Formulário enviado com sucesso");

      // Refresh the workflow data
      await fetchWorkflow();
    } catch (error) {
      console.error("Error submitting form:", error);
      snackbar.error("Erro ao enviar formulário");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderBody = (activity: ActivityTemplate) => {
    if (selectedIncoming !== undefined) {
      return (
        <IncomingActivity
          selected={selectedIncoming}
          value={context[selectedIncoming?.namespace as string]}
          general={general}
          onChange={(value) => {
            updateCreatingContext(
              selectedIncoming?.namespace as string,
              value,
              ActivityTypeEnum.INCOMING,
            );
          }}
          apiClient={apiClient}
          styleContext={styleContext}
          highlightQuery={highlightQuery}
        />
      );
    }

    if (permissionsLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Spinner size="xl" />
        </div>
      );
    }

    // Check if user has access to this activity
    const hasReadAccess = hasActivityAccess(activity, "read");
    const hasWriteAccess = hasActivityAccess(activity, "write");

    // If user doesn't have read access, show a blocked message
    if (!hasReadAccess) {
      // Check if we're in high contrast mode
      const isHighContrast =
        styleContext.state.buttonHoverColorWeight === "800";

      return (
        <div
          className={`rounded-lg p-8 text-center my-8`}
          tabIndex={0}
          role="alert"
          aria-labelledby="restricted-access-title"
          aria-describedby="restricted-access-description"
          style={{ outline: "none" }}
        >
          <div className="mb-4">
            <FaShieldAlt
              size={48}
              className={
                isHighContrast ? "text-white mx-auto" : "text-red-500 mx-auto"
              }
              aria-hidden="true"
            />
          </div>
          <h3
            id="restricted-access-title"
            className={`text-xl font-semibold mb-2 ${
              isHighContrast ? "text-white" : ""
            }`}
          >
            Acesso Restrito
          </h3>
          <p
            id="restricted-access-description"
            className={`mb-4 ${
              isHighContrast
                ? "text-gray-100"
                : "text-gray-600 dark:text-gray-300"
            }`}
          >
            Você não possui permissões para visualizar esta atividade.
          </p>
          <div
            className={`rounded-lg p-4 text-left max-w-lg mx-auto ${
              isHighContrast
                ? "bg-black border border-white"
                : "bg-gray-100 dark:bg-gray-700"
            }`}
          >
            <p
              className={`text-sm font-medium mb-2 ${
                isHighContrast
                  ? "text-white"
                  : "text-gray-700 dark:text-gray-300"
              }`}
            >
              Detalhes do acesso:
            </p>
            <ul
              className={`text-sm list-disc pl-5 mb-3 ${
                isHighContrast
                  ? "text-gray-100"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              {activity.accessLevel > 0 && (
                <li>
                  Nível de acesso necessário:{" "}
                  <span
                    className={`font-medium ${isHighContrast ? "text-white" : ""}`}
                  >
                    {activity.accessLevel}
                  </span>
                  <span
                    className={
                      isHighContrast
                        ? "text-gray-300 ml-2"
                        : "text-gray-500 ml-2"
                    }
                  >
                    (Seu nível: {userIam?.accessLevel})
                  </span>
                </li>
              )}
              {activity.permissions !== undefined &&
                ((activity.permissions?.users as any)?.length > 0 ||
                  (activity.permissions?.roles as any)?.length > 0 ||
                  (activity.permissions?.groups as any)?.length > 0) && (
                  <li>
                    Permissões específicas requeridas para esta atividade:
                    <ul className="pl-5 mt-1 space-y-1 text-xs">
                      {activity.permissions.users &&
                        activity.permissions.users.length > 0 && (
                          <li className={isHighContrast ? "text-gray-200" : ""}>
                            Usuários com acesso:{" "}
                            {activity.permissions.users
                              .map((user) => user.name)
                              .join(", ")}
                          </li>
                        )}
                      {activity.permissions.roles &&
                        activity.permissions.roles.length > 0 && (
                          <li className={isHighContrast ? "text-gray-200" : ""}>
                            Perfis com acesso:{" "}
                            {activity.permissions.roles
                              .map((role) => role.name)
                              .join(", ")}
                          </li>
                        )}
                      {activity.permissions.groups &&
                        activity.permissions.groups.length > 0 && (
                          <li className={isHighContrast ? "text-gray-200" : ""}>
                            Grupos com acesso:{" "}
                            {activity.permissions.groups
                              .map((group) => group.name)
                              .join(", ")}
                          </li>
                        )}
                    </ul>
                  </li>
                )}
              <li>Tipo de atividade: {ActivityTypeEnum[activity.type]}</li>
            </ul>
            <p
              className={`text-xs italic ${
                isHighContrast
                  ? "text-gray-300"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              Esta é uma restrição de acesso baseada em permissões. Se você
              acredita que deveria ter acesso a esta atividade, entre em contato
              com o administrador do sistema.
            </p>
          </div>
        </div>
      );
    }

    // Otherwise, render normal activity types
    switch (activity.type) {
      case ActivityTypeEnum.FORM: {
        const formTemplate = activity.template as FormTemplate;
        const formValue = context[activity.namespace];
        const isFormCompleted =
          formValue && formValue.state === ActivityStateEnum.COMPLETED;
        // Only allow editing if user has write access
        const isFormEditable =
          !isCreating && !isFormCompleted && hasWriteAccess;

        return (
          <>
            {isCreating || isFormEditable ? (
              <Field
                field={formTemplate.form}
                value={formValue?.form ?? {}}
                context={formValue?.form ?? {}}
                validContext={valid[activity.namespace] ?? {}}
                valid={valid[activity.namespace] ?? {}}
                general={{
                  ...general,
                  $state: "create",
                }}
                onChange={(value) => {
                  if (isCreating) {
                    updateCreatingContext(
                      activity.namespace,
                      value,
                      ActivityTypeEnum.FORM,
                    );
                  } else {
                    setContext((prev: any) => ({
                      ...prev,
                      [activity.namespace]: {
                        ...prev[activity.namespace],
                        form: value,
                      },
                    }));
                  }
                }}
                onValidChange={(validValue) => {
                  setValid((prev: any) => ({
                    ...prev,
                    [activity.namespace]: validValue,
                  }));
                }}
              />
            ) : (
              <FieldView
                field={formTemplate.form}
                context={formValue?.form ?? {}}
                value={formValue.form}
                general={general}
                highlightQuery={highlightQuery}
              />
            )}

            {/* Show submit button for editable forms in existing workflows */}
            {isFormEditable && (
              <div className="mt-6 flex justify-end">
                <DSButton
                  className={`px-6 py-2.5 rounded-lg shadow-lg flex items-center space-x-2 ${
                    canSubmit && !isSubmitting
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                      : "bg-gray-400 cursor-not-allowed text-white"
                  }`}
                  onClick={handleFormSubmit}
                  disabled={!canSubmit || isSubmitting}
                  title={
                    !canSubmit ? "Complete todos os campos obrigatórios" : ""
                  }
                >
                  {isSubmitting ? (
                    <span className="mr-2">
                      <Spinner />
                    </span>
                  ) : null}
                  <span>Enviar</span>
                </DSButton>
              </div>
            )}
          </>
        );
      }
      case ActivityTypeEnum.SIGNATURE: {
        return (
          <SignatureActivity
            activity={
              activity as ActivityTemplate & { template: SignaturesTemplate }
            }
            context={context}
            general={general}
            activeStep={activeStep}
            workflow={workflow}
            apiClient={apiClient}
            value={context[activity.namespace] ?? {}}
            onSignatureComplete={updateContext}
          />
        );
      }
      case ActivityTypeEnum.TAX: {
        return (
          <TaxActivity
            activity={activity as ActivityTemplate & { template: TaxTemplate }}
            context={context}
            general={general}
            activeStep={activeStep}
            value={context[activity.namespace] ?? {}}
            onTaxComplete={updateContext}
          />
        );
      }
      case ActivityTypeEnum.DOCUMENT: {
        return (
          <DocumentActivity
            activity={
              activity as ActivityTemplate & { template: DocumentTemplate }
            }
            context={context}
            general={general}
            activeStep={activeStep}
            value={context[activity.namespace] ?? {}}
            onDocumentComplete={updateContext}
          />
        );
      }
      default: {
        return <div>Activity type not supported</div>;
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        setLoading(true);
        await fetchWorkflow();
        checkForStoredDraft(id);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    setGeneral((prev) => ({
      ...prev,
      $data: context,
    }));
  }, [context]);

  // Add new useEffect to handle incomingListOpen state
  useEffect(() => {
    if (workflow?.schema?.incoming) {
      setIncomingListOpen(workflow.schema.incoming.length > 0);
    }
  }, [workflow?.schema?.incoming]);

  useEffect(() => {
    if (workflow?.schema?.activities) {
      const currentActivity = workflow.schema.activities[activeStep];
      if (currentActivity.type === ActivityTypeEnum.FORM) {
        const isComplete = checkValidCompletion(
          valid[currentActivity.namespace],
        );
        setCanSubmit(isComplete);
      }
    }
  }, [workflow?.schema?.activities, activeStep, valid]);

  useEffect(() => {
    const activityCount = workflow?.schema?.activities?.length ?? 0;
    if (activityCount === 0) {
      setActiveStep(0);
      return;
    }

    if (activeStep >= activityCount) {
      setActiveStep(activityCount - 1);
    }
  }, [workflow?.schema?.activities?.length, activeStep]);

  return (
    <div className="flex flex-col space-y-6 sm:px-0 md:px-6 mt-6 mb-24">
      {loading ? (
        <div className="pt-10 text-center">
          <div className="mx-auto h-10 w-10 text-muted-foreground">
            <Spinner size="xl" />
          </div>
        </div>
      ) : workflow ? (
        <>
          <div className="flex justify-center">
            <div
              className="flex flex-col justify-center mx-6 md:mx-0 space-y-4"
              style={{ width: window.innerWidth <= 500 ? "auto" : "882px" }}
            >
              {isCreating && isLocalDraft && (
                <div className="mb-4 flex items-center justify-center space-x-4">
                  <TooltipProvider>
                    <DSTooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={`flex items-center px-4 py-2 rounded-lg ${
                            styleContext.state.buttonHoverColorWeight === "200"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-yellow-900 text-yellow-200"
                          }`}
                        >
                          <FaExclamationTriangle className="mr-2" size={14} />
                          <span className="text-xs">
                            Rascunho salvo apenas neste dispositivo
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-sm">
                        As alterações feitas neste formulário são salvas
                        automaticamente apenas neste dispositivo. Para salvar
                        permanentemente, clique em "Solicitar".
                      </TooltipContent>
                    </DSTooltip>
                  </TooltipProvider>
                  <button
                    onClick={handleDiscardDraft}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                      styleContext.state.buttonHoverColorWeight === "200"
                        ? "bg-gray-500 hover:bg-gray-600 text-white"
                        : "bg-gray-800 hover:bg-gray-700 text-gray-200"
                    }`}
                  >
                    <FaTrash size={14} />
                    <span className="text-xs">Descartar Rascunho</span>
                  </button>
                </div>
              )}

              {/* Header Section */}
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-2xl md:text-3xl font-medium">
                      {workflow.label}
                    </h1>
                    <div className="flex items-center space-x-1">
                      <span
                        className={`mt-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          isCreating
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {formatId(isCreating ? workflow.id : (id as string))}
                      </span>
                      <TooltipProvider>
                        <DSTooltip open={isTooltipOpen}>
                          <TooltipTrigger asChild>
                            <DSButton
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  isCreating ? workflow.id : (id as string),
                                );
                                setIsTooltipOpen(true);
                                setTimeout(() => setIsTooltipOpen(false), 1500);
                              }}
                              variant="ghost"
                              className="mt-2 p-1 rounded hover:bg-gray-100 transition-colors"
                            >
                              <FaLink size={12} />
                            </DSButton>
                          </TooltipTrigger>
                          <TooltipContent side="top">Copiado!</TooltipContent>
                        </DSTooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  {workflow.description && (
                    <div>
                      <div
                        className={`text-gray-600 ${
                          workflow.description.length > 200
                            ? "line-clamp-3"
                            : ""
                        }`}
                        dangerouslySetInnerHTML={{
                          __html: workflow.description,
                        }}
                      />
                      {workflow.description.length > 200 && (
                        <DSButton
                          onClick={() => {
                            setSelectedDescription({
                              text: workflow.description,
                              label: workflow.label,
                            });
                          }}
                          variant="ghost"
                          className={`h-auto p-0 ${
                            styleContext.state.buttonHoverColorWeight === "200"
                              ? "text-blue-600 hover:text-blue-700"
                              : "text-blue-400 hover:text-blue-300"
                          }`}
                        >
                          Ver mais
                        </DSButton>
                      )}
                    </div>
                  )}

                  {/* Timestamps */}
                  <div className="mt-4 space-y-1 mb-6">
                    {isCreating ? (
                      <div className="flex items-center text-sm text-gray-500">
                        <FaClock className="mr-2" size={12} />
                        <span>
                          {isLocalDraft ? (
                            <>
                              Último rascunho:{" "}
                              {formatDate(
                                Number(
                                  localStorage.getItem(
                                    getLastUpdateKey(id as string),
                                  ),
                                ) || new Date(),
                              )}
                            </>
                          ) : (
                            "Nenhum rascunho salvo"
                          )}
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center text-sm text-gray-500">
                          <FaClock className="mr-2" size={12} />
                          <span>
                            Criado em: {formatDate(workflow.createdAt)}
                          </span>
                        </div>
                        {workflow.updatedAt && (
                          <div className="flex items-center text-sm text-gray-500">
                            <FaHistory className="mr-2" size={12} />
                            <span>
                              Atualizado em: {formatDate(workflow.updatedAt)}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* QR Code */}
                <div className="ml-6">
                  <TooltipProvider>
                    <DSTooltip>
                      <TooltipTrigger asChild>
                        <div
                          onClick={() => setShowQRModal(true)}
                          className={`p-3 rounded-lg cursor-pointer transition-all ${
                            styleContext.state.buttonHoverColorWeight === "200"
                              ? "bg-gray-100"
                              : "bg-gray-800"
                          }`}
                        >
                          <QRCodeSVG
                            value={`${window.location.origin}${
                              isCreating
                                ? `/workflows-schema/${workflow.id}`
                                : `/workflows/${id}`
                            }`}
                            size={120}
                            level="H"
                            marginSize={6}
                            className="rounded-lg"
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        Escaneie para acessar{" "}
                        {isCreating ? "o modelo" : "o protocolo"}
                      </TooltipContent>
                    </DSTooltip>
                  </TooltipProvider>
                </div>
              </div>
              {/* End of Header Section */}
            </div>
          </div>

          <div className="flex">
            <div className="w-1/4 pr-6 border-r">
              {/* Prerequisites Section */}
              {workflow.schema?.incoming?.length > 0 && (
                <>
                  <IncomingList
                    incomings={workflow.schema?.incoming}
                    selectedIncoming={selectedIncoming}
                    isOpen={incomingListOpen}
                    onSelect={setSelectedIncoming}
                    onToggle={setIncomingListOpen}
                    styleContext={styleContext}
                    context={context}
                  />
                  {/* Divider */}
                  <div className="border-b mb-6"></div>
                </>
              )}

              {/* Activities List */}
              <ActivitiesList
                activities={workflow.schema?.activities || []}
                activeStep={activeStep}
                setActiveStep={(step) => {
                  handleStepChange(step);
                  setSelectedIncoming(undefined);
                }}
                styleContext={styleContext}
                context={context}
                incoming={workflow.schema?.incoming}
              />

              {/* Divider after activities */}
              {workflow?.schema?.outgoing?.length > 0 && (
                <div className="border-b my-6"></div>
              )}

              {/* Subsequent Workflows Section */}
              {workflow?.schema?.outgoing?.length > 0 && (
                <OutgoingList
                  outgoing={workflow.schema.outgoing}
                  showDependentWorkflows={showDependentWorkflows}
                  setShowDependentWorkflows={setShowDependentWorkflows}
                  styleContext={styleContext}
                  context={context}
                  currentWorkflowId={id}
                  activities={workflow.schema.activities || []}
                  stage={workflow.stage ?? WorkflowStageEnum.DEVELOPMENT}
                />
              )}
            </div>

            {/* Activity Content */}
            <div className="w-3/4 pl-6">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <Spinner size="xl" />
                </div>
              ) : (
                workflow.schema?.activities?.[activeStep] && (
                  <div className="space-y-6">
                    <div className="flex flex-col">
                      <h2 className="text-xl font-bold">
                        {selectedIncoming?.label ??
                          workflow.schema.activities[activeStep].label}
                      </h2>
                      <h2>
                        {selectedIncoming?.documentation ??
                          workflow.schema.activities[activeStep].documentation}
                      </h2>
                    </div>
                    {renderBody(workflow.schema.activities[activeStep])}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Request Button - Only show when creating */}
          {isCreating && (
            <div className="fixed bottom-16 right-4">
              <DSButton
                className={`px-6 py-2.5 rounded-lg shadow-lg flex items-center space-x-2 ${
                  canSubmit
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                    : "bg-gray-400 cursor-not-allowed text-white"
                }`}
                onClick={handleProtocol}
                disabled={loading}
                title={
                  !canSubmit ? "Complete todos os campos obrigatórios" : ""
                }
              >
                {loading ? (
                  <span className="mr-2">
                    <Spinner />
                  </span>
                ) : null}
                <span>Solicitar</span>{" "}
              </DSButton>
            </div>
          )}
        </>
      ) : null}

      <Dialog
        open={!!selectedDescription}
        onOpenChange={(open) => !open && setSelectedDescription(null)}
      >
        <DialogContent
          className="shadow-xl max-w-[600px]"
          style={{
            backgroundColor: styleContext.state.backgroundColor,
          }}
        >
          <DialogHeader className="px-6 pt-4 pb-4 border-b">
            <div className="flex justify-between">
              <DialogTitle
                className="text-xl font-bold mt-2 mr-3"
                style={{ color: styleContext.state.textColor }}
              >
                {selectedDescription?.label}
              </DialogTitle>
              <div>
                <DSButton
                  onClick={() => setSelectedDescription(null)}
                  variant="ghost"
                  className="hover:bg-opacity-10 rounded p-1.5 transition-colors duration-150"
                  style={{
                    color:
                      styleContext.state.buttonHoverColorWeight === "200"
                        ? "#6B7280"
                        : "#9CA3AF",
                    backgroundColor:
                      styleContext.state.buttonHoverColorWeight === "200"
                        ? "rgba(107, 114, 128, 0.1)"
                        : "rgba(156, 163, 175, 0.1)",
                  }}
                >
                  <FaTimes size={12} />
                </DSButton>
              </div>
            </div>
          </DialogHeader>
          <div className="px-6 py-6 overflow-y-auto">
            <div
              className="prose dark:prose-invert max-w-none"
              style={{ color: styleContext.state.textColor }}
              dangerouslySetInnerHTML={{
                __html: selectedDescription?.text || "",
              }}
            />
          </div>
          <DialogFooter className="px-6 pt-4 pb-4 border-t space-x-3">
            <DSButton
              variant="outline"
              className="px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center space-x-2"
              onClick={() => setSelectedDescription(null)}
              style={{
                backgroundColor:
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "#f3f4f6"
                    : "#1f2937",
                color: styleContext.state.textColor,
              }}
            >
              <span>Fechar</span>
            </DSButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Modal */}
      {workflow && (
        <Dialog
          open={showQRModal}
          onOpenChange={(open) => !open && setShowQRModal(false)}
        >
          <DialogContent
            className="py-4 max-w-[350px]"
            style={{
              backgroundColor: styleContext.state.backgroundColor,
              maxHeight: "350px",
            }}
          >
            <div>
              <QRCodeSVG
                value={`${window.location.origin}${
                  isCreating
                    ? `/workflows-schema/${workflow.id}`
                    : `/workflows/${id}`
                }`}
                size={300}
                level="H"
                marginSize={6}
                className="rounded-lg"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
