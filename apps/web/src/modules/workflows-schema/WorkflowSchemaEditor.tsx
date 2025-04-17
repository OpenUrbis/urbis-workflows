import React, { useContext, useEffect, useState } from "react";
import {
  Spinner,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  Tooltip,
  FormControl,
  FormLabel,
  FormHelperText,
  IconButton,
} from "@chakra-ui/react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaPlus,
  FaTrash,
  FaSave,
  FaExclamationTriangle,
  FaWpforms,
  FaSignature,
  FaFileInvoiceDollar,
  FaFileAlt,
  FaCode,
  FaDatabase,
  FaRocket,
  FaFlask,
  FaChevronDown,
  FaProjectDiagram,
  FaCog,
} from "react-icons/fa";
import { IFormContext } from "@open-urbis/types";
import { Input, Select, SL } from "../../components";
import EditableHeader from "../../components/EditableHeader";
import { useSnackbar } from "../../hooks/snackbar";
import {
  HotkeyContext,
  withNoModifiers,
  withNumberInput,
} from "../../reducers/hotkeys.reducer";
import { VersionsMenu } from "./components/VersionsMenu";
import { ApiClient } from "../../api";
import { WorkflowSchema } from "../../api/types/workflows-schema.dto";
import { FieldEditable } from "./form-engine/FieldEditable";
import {
  ActivityTemplate,
  ActivityTypeEnum,
  SignaturesTemplate,
  TaxTemplate,
  DocumentTemplate,
  FormTemplate,
  PrivacyLevelEnum,
  Incoming,
  Outgoing,
} from "../../api/types/schema";
import { ActivityStateEnum } from "../../api/types/workflows.dto";
import { v4 as uuidv4 } from "uuid";
import { ActivitySignatureEditor } from "./activities/ActivitySignatureEditor";
import { ActivityDocumentEditor } from "./activities/ActivityDocumentEditor";
import { ActivityTaxEditor } from "./activities/ActivityTaxEditor";
import { CodeViewerModal } from "./components/CodeViewerModal";
import { StyleContext } from "../../reducers/style.reducer";
import { WorkflowConstants } from "./configs/WorkflowConstants";
import { WorkflowLibrary } from "./configs/WorkflowLibrary";
import { WorkflowDependencies } from "./configs/WorkflowDependencies";
import { WorkflowOutgoingDependencies } from "./configs/WorkflowOutgoingDependencies";
import {
  loadCodeModules,
  loadConstantVariables,
  loadSignatureMetadata,
} from "../../utils/workflow-context";
import { ActivityDependenciesSelector } from "./components/ActivityDependenciesSelector";
import { DependencyGraphVisualization } from "./components/DependencyGraphVisualization";
import { PermissionsSelector } from "./components/PermissionsSelector";
import SideDrawer from "../../components/SideDrawer";

const apiClient = new ApiClient({
  baseURL: import.meta.env.VITE_BACK_END_API || "",
  headers: {
    authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  },
});

// Storage keys and helper functions
const getTempWorkflowKey = (workflowId: string) =>
  `temp_workflow_schema_state:${workflowId}`;
const getLastUpdateKey = (workflowId: string) =>
  `temp_workflow_schema_last_update:${workflowId}`;
const NEW_WORKFLOW_ID_KEY = "new_workflow_schema_temp_id";

const getNewSubjectId = () => {
  let tempId = localStorage.getItem(NEW_WORKFLOW_ID_KEY);
  if (!tempId) {
    tempId = "new-" + crypto.randomUUID();
    localStorage.setItem(NEW_WORKFLOW_ID_KEY, tempId);
  }
  return tempId;
};

const clearNewSubjectId = () => {
  localStorage.removeItem(NEW_WORKFLOW_ID_KEY);
};

interface StoredSubject {
  data: WorkflowSchema;
  timestamp: number;
}

type VersionInfo = {
  id: string;
  version: number;
  commitMessage: string;
  timestamp: string;
  createdBy: string;
};

const calculateReverseVersionNumber = (
  index: number,
  total: number,
  page: number = 1,
  pageSize: number = 10
): number => {
  const reversedIndex = total - index - 1;
  return pageSize * (page - 1) + (reversedIndex + 1);
};

const getActivityTypeIcon = (type: ActivityTypeEnum) => {
  switch (type) {
    case ActivityTypeEnum.FORM:
      return <FaWpforms className="text-blue-500" />;
    case ActivityTypeEnum.SIGNATURE:
      return <FaSignature className="text-green-500" />;
    case ActivityTypeEnum.DOCUMENT:
      return <FaFileAlt className="text-purple-500" />;
    case ActivityTypeEnum.TAX:
      return <FaFileInvoiceDollar className="text-yellow-500" />;
    default:
      return null;
  }
};

const getActivityTypeLabel = (type: ActivityTypeEnum) => {
  switch (type) {
    case ActivityTypeEnum.FORM:
      return "Formulário";
    case ActivityTypeEnum.SIGNATURE:
      return "Assinatura";
    case ActivityTypeEnum.TAX:
      return "Taxa";
    case ActivityTypeEnum.DOCUMENT:
      return "Documento";
    default:
      return "Desconhecido";
  }
};

const tabConfig = [
  {
    id: "activities",
    icon: <FaWpforms className="text-blue-500" />,
    label: "Atividades",
    shortcut: "Q",
  },
  {
    id: "variables",
    icon: <FaCode className="text-green-500" />,
    label: "Variáveis",
    shortcut: "A",
  },
  {
    id: "functions",
    icon: <FaCode className="text-yellow-500" />,
    label: "Biblioteca",
    shortcut: "Z",
  },
  {
    id: "incoming",
    icon: (
      <FaProjectDiagram
        className="text-purple-500"
        style={{ transform: "scaleX(-1)" }}
      />
    ),
    label: "Pré-requisitos",
    shortcut: "W",
  },
  {
    id: "outgoing",
    icon: <FaProjectDiagram className="text-purple-500" />,
    label: "Fluxos Subsequentes",
    shortcut: "S",
  },
];

const ActivityMenuButton: React.FC<{
  onAddActivity: (type: ActivityTypeEnum) => void;
  buttonClassName?: string;
  styleContext: any;
}> = ({ onAddActivity, buttonClassName, styleContext }) => {
  return (
    <Menu>
      <MenuButton
        as="button"
        className={`px-6 py-2.5 rounded-lg flex items-center justify-center ${
          styleContext.state.buttonHoverColorWeight === "200"
            ? "bg-blue-500 hover:bg-blue-600 text-white"
            : "bg-blue-800 hover:bg-blue-700 text-blue-100"
        } ${buttonClassName || ""}`}
      >
        <div className="flex items-center">
          <FaPlus size={14} className="mr-2" />
          <span>Atividade</span>
        </div>
      </MenuButton>
      <MenuList
        zIndex={"overlay"}
        bg={
          styleContext.state.buttonHoverColorWeight === "200"
            ? "white"
            : "gray.800"
        }
        maxHeight="300px"
        overflowY="auto"
        boxShadow="lg"
        border="1px solid"
        borderColor={
          styleContext.state.buttonHoverColorWeight === "200"
            ? "gray.200"
            : "gray.600"
        }
        py={2}
      >
        {[
          {
            type: ActivityTypeEnum.FORM,
            label: "Formulário",
            icon: <FaWpforms className="text-blue-500" />,
          },
          {
            type: ActivityTypeEnum.SIGNATURE,
            label: "Assinatura",
            icon: <FaSignature className="text-green-500" />,
          },
          {
            type: ActivityTypeEnum.TAX,
            label: "Taxa",
            icon: <FaFileInvoiceDollar className="text-yellow-500" />,
          },
          {
            type: ActivityTypeEnum.DOCUMENT,
            label: "Documento",
            icon: <FaFileAlt className="text-purple-500" />,
          },
        ].map((item) => (
          <MenuItem
            key={item.type}
            onClick={() => onAddActivity(item.type)}
            className="flex items-center space-x-2"
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
            px={4}
            py={2}
          >
            {item.icon}
            <span style={{ color: styleContext.state.textColor }}>
              {item.label}
            </span>
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
};

export function WorkflowSchemaEditor(): JSX.Element {
  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const { id } = useParams();
  const [workflowSchema, setWorkflowSchema] = useState<WorkflowSchema>();
  const [currentVersion, setCurrentVersion] = useState<{
    version: number;
    stage?: string;
  }>({ version: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingVersions, setLoadingVersions] = useState(true);
  const [loadingSecondary, setLoadingSecondary] = useState(true);
  const [selectedActivityIndex, setSelectedActivityIndex] = useState<number>(0);
  const hotkeyContext = useContext(HotkeyContext);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [context, setContext] = useState<any>({});
  const [valid, setValid] = useState<any>({});
  const { isOpen, onClose } = useDisclosure();
  const [conflictData, setConflictData] = useState<{
    localData: WorkflowSchema;
    backendData: WorkflowSchema;
  } | null>(null);
  const [isLocalDraft, setIsLocalDraft] = useState(false);
  const [versionInfos, setVersionInfos] = useState<VersionInfo[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>("activities");
  const [showWorkflowJson, setShowWorkflowJson] = useState(false);
  const [showContextData, setShowContextData] = useState(false);
  const styleContext = useContext(StyleContext);
  const [editorGeneral, setEditorGeneral] = useState<IFormContext>({
    $data: context,
    $modules: {},
    $state: "editor",
    $user: undefined,
    $variables: {},
  });
  const [showDependencyGraph, setShowDependencyGraph] = useState(false);
  const [showConfigDrawer, setShowConfigDrawer] = useState(false);
  // Create a stable ID for the config drawer
  const configDrawerId = React.useMemo(
    () => `workflow-config-${id || "new"}`,
    [id]
  );

  const fetchVersions = async (workflowId: string) => {
    setLoadingVersions(true);
    try {
      const versionsResponse =
        await apiClient.workflowsSchema.findOneVersions(workflowId);

      const versionInfos: VersionInfo[] = versionsResponse.versions.map(
        (version, index) => ({
          id: version.id,
          version: calculateReverseVersionNumber(
            index,
            versionsResponse.pagination.total,
            versionsResponse.pagination.page,
            versionsResponse.pagination.pageSize
          ),
          commitMessage: version.commit,
          timestamp: new Date(version.createdAt).toISOString(),
          createdBy: version.createdBy.name,
        })
      );

      setVersionInfos(versionInfos);
      setCurrentVersion({
        version: calculateReverseVersionNumber(
          0,
          versionsResponse.pagination.total,
          versionsResponse.pagination.page,
          versionsResponse.pagination.pageSize
        ),
      });
    } catch (error) {
      console.error("Error fetching versions:", error);
      snackbar.error("Failed to fetch workflow versions");
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleConflictResolution = (useLocalChanges: boolean) => {
    if (!conflictData) return;

    if (useLocalChanges) {
      updateSubject(conflictData.localData);
    } else {
      updateSubject(conflictData.backendData);
    }
    setConflictData(null);
    onClose();
  };

  const checkForConflicts = async (
    backendData: WorkflowSchema,
    storageId: string
  ) => {
    const savedStateStr = localStorage.getItem(getTempWorkflowKey(storageId));
    const lastUpdateStr = localStorage.getItem(getLastUpdateKey(storageId));

    if (!savedStateStr || !lastUpdateStr) {
      setIsLocalDraft(false);
      return backendData;
    }

    const savedState: StoredSubject = JSON.parse(savedStateStr);
    // Only set as draft if there are actual differences
    if (JSON.stringify(savedState.data) !== JSON.stringify(backendData)) {
      setIsLocalDraft(true);
      return savedState.data;
    }

    setIsLocalDraft(false);
    return backendData;
  };

  const fetchSecondaryData = async (workflow: WorkflowSchema) => {
    if (!workflow) {
      setLoadingSecondary(false);
      return;
    }

    try {
      setLoadingSecondary(true);
      const user = await apiClient.users.getProfile();
      const variables = await loadConstantVariables(
        workflow.schema?.constants ?? [],
        apiClient,
        snackbar
      );
      const modules = await loadCodeModules(
        workflow.schema?.code ?? [],
        apiClient,
        snackbar
      );
      const signatureMetadata = loadSignatureMetadata(
        workflow.schema?.activities ?? []
      );

      setEditorGeneral({
        $data: context,
        $modules: modules,
        $variables: variables,
        $user: user as any,
        $state: "editor",
        $tree: {
          activities: workflow.schema?.activities,
          signatures: signatureMetadata,
        },
      });
    } catch (error) {
      console.error("Error fetching secondary data:", error);
      snackbar.error("Erro ao carregar dados secundários");
    } finally {
      setLoadingSecondary(false);
    }
  };

  const fetchSubjectVersion = async (version: number, stage?: string) => {
    setLoading(true);
    if (!workflowSchema || !workflowSchema.id) {
      setLoading(false);
      return;
    }

    const versionInfo = versionInfos.find((v) => v.version === version);
    if (!versionInfo) {
      setLoading(false);
      return;
    }

    try {
      const workflow = await apiClient.workflowsSchema.findOneVersion(
        workflowSchema.id,
        versionInfo.id
      );
      setWorkflowSchema({
        ...workflow,
        id: workflowSchema.id,
        updatedAt: workflowSchema.updatedAt,
        updatedBy: workflowSchema.updatedBy,
      });
      setCurrentVersion({ version, stage });
    } catch (error) {
      console.error("Error fetching version:", error);
      snackbar.error("Failed to fetch version");
    }
    setLoading(false);
  };

  const fetchSubject = async () => {
    if (id !== "new" && id !== undefined) {
      try {
        const workflow = await apiClient.workflowsSchema.findOne(id);
        const resolvedData = await checkForConflicts(workflow, id);
        setWorkflowSchema(resolvedData);
        setLoading(false);
        fetchSecondaryData(resolvedData);
        fetchVersions(id);
      } catch (error) {
        const savedStateStr = localStorage.getItem(getTempWorkflowKey(id));
        if (savedStateStr) {
          const savedState: StoredSubject = JSON.parse(savedStateStr);
          setWorkflowSchema(savedState.data);
          fetchSecondaryData(savedState.data);
          setIsLocalDraft(true);
        }
        console.error("Error fetching workflow:", error);
        snackbar.error("Failed to fetch workflow");
      }
    } else {
      const tempId = getNewSubjectId();
      const savedStateStr = localStorage.getItem(getTempWorkflowKey(tempId));

      if (savedStateStr) {
        // Re-entering a previously started new subject
        const savedState: StoredSubject = JSON.parse(savedStateStr);
        setWorkflowSchema(savedState.data);
        fetchSecondaryData(savedState.data);
        setIsLocalDraft(true);
      } else {
        // First time entering new subject
        const newWorkflow: Partial<WorkflowSchema> = {
          label: "Inclua um nome para o assunto",
          description: "Inclua uma descrição para o assunto",
          schema: {
            plugins: [],
            activities: [],
            incoming: [],
            outgoing: [],
            code: [],
            constants: [],
            hooks: [],
            control: {
              accessLevel: PrivacyLevelEnum.PUBLIC,
            },
          },
        };
        setWorkflowSchema(newWorkflow as WorkflowSchema);
        setLoadingSecondary(false);
        setIsLocalDraft(false); // Don't show draft header for new subjects initially
      }
      setLoading(false);
    }
  };

  const updateSubject = (newSubject: WorkflowSchema) => {
    setWorkflowSchema(newSubject);
    const storageId = id === "new" ? getNewSubjectId() : id;
    if (!storageId) return;

    // For both new and existing subjects, only save if there are actual changes
    const currentStateStr = localStorage.getItem(getTempWorkflowKey(storageId));
    const currentState = currentStateStr
      ? JSON.parse(currentStateStr).data
      : null;

    if (JSON.stringify(newSubject) !== JSON.stringify(currentState)) {
      const newState: StoredSubject = {
        data: newSubject,
        timestamp: Date.now(),
      };
      localStorage.setItem(
        getTempWorkflowKey(storageId),
        JSON.stringify(newState)
      );
      localStorage.setItem(getLastUpdateKey(storageId), Date.now().toString());
      setIsLocalDraft(true);
    }
  };

  const handleAddActivity = (type: ActivityTypeEnum) => {
    if (!workflowSchema) return;

    const newActivity: ActivityTemplate = {
      id: crypto.randomUUID(),
      type,
      label: "Nova Atividade",
      documentation: "Descrição da atividade",
      namespace: "activity",
      template:
        type === ActivityTypeEnum.FORM
          ? ({
              form: {
                key: "root",
                type: "block",
                options: {
                  layout: "step",
                  hideEditMenu: true,
                },
                expressions: [],
                block: [],
              },
            } as FormTemplate)
          : type === ActivityTypeEnum.DOCUMENT
            ? ({
                documents: [],
              } as DocumentTemplate)
            : type === ActivityTypeEnum.SIGNATURE
              ? ({
                  signatures: [],
                } as SignaturesTemplate)
              : type === ActivityTypeEnum.TAX
                ? ({
                    taxes: [],
                  } as TaxTemplate)
                : ({} as FormTemplate),
      accessLevel: PrivacyLevelEnum.PUBLIC,
      permissions: {
        users: [],
        roles: [],
        groups: [],
      },
    };

    updateSubject({
      ...workflowSchema,
      schema: {
        ...workflowSchema.schema,
        activities: [...(workflowSchema.schema?.activities ?? []), newActivity],
      },
    });
  };

  const handleRemoveActivity = async (index: number) => {
    if (!workflowSchema || !workflowSchema.schema?.activities) return;

    const confirmDelete = await confirmation(
      "Tem certeza que deseja remover esta atividade?"
    );

    if (!confirmDelete) return;

    const newActivities = [...workflowSchema.schema.activities];
    newActivities.splice(index, 1);

    updateSubject({
      ...workflowSchema,
      schema: {
        ...workflowSchema.schema,
        activities: newActivities,
      },
    });

    if (selectedActivityIndex >= newActivities.length) {
      setSelectedActivityIndex(Math.max(0, newActivities.length - 1));
    }
  };

  const handleUpdateActivity = (
    index: number,
    updates: Partial<ActivityTemplate>
  ) => {
    if (!workflowSchema || !workflowSchema.schema?.activities) return;

    const newActivities = [...workflowSchema.schema.activities];
    newActivities[index] = {
      ...newActivities[index],
      ...updates,
    };

    updateSubject({
      ...workflowSchema,
      schema: {
        ...workflowSchema.schema,
        activities: newActivities,
      },
    });
  };

  const handleUpdatePermissions = (
    index: number,
    permissions: {
      users: { id: string; name: string; access: "read" | "write" }[];
      roles: { id: string; name: string; access: "read" | "write" }[];
      groups: { id: string; name: string; access: "read" | "write" }[];
    }
  ) => {
    if (!workflowSchema || !workflowSchema.schema?.activities) return;

    const newActivities = [...workflowSchema.schema.activities];
    newActivities[index] = {
      ...newActivities[index],
      permissions,
    };

    updateSubject({
      ...workflowSchema,
      schema: {
        ...workflowSchema.schema,
        activities: newActivities,
      },
    });
  };

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    index: number
  ) => {
    setDraggingIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    index: number
  ) => {
    e.preventDefault();
    if (!workflowSchema?.schema?.activities || draggingIndex === null) return;

    let newIndex = draggingIndex < index ? index + 1 : index;
    newIndex =
      newIndex > workflowSchema.schema.activities.length
        ? workflowSchema.schema.activities.length
        : newIndex;

    if (draggingIndex !== newIndex) {
      const newActivities = [...workflowSchema.schema.activities];
      const itemToMove = newActivities.splice(draggingIndex, 1)[0];

      if (draggingIndex < newIndex) {
        newIndex--;
      }

      newActivities.splice(newIndex, 0, itemToMove);

      updateSubject({
        ...workflowSchema,
        schema: {
          ...workflowSchema.schema,
          activities: newActivities,
        },
      });
      setDraggingIndex(newIndex);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    setDraggingIndex(null);
  };

  const handleDelete = async () => {
    if (!workflowSchema || !id || id === "new") return;

    const response = await confirmation(
      "Tem certeza que deseja remover este assunto?"
    );

    if (!response) {
      return;
    }

    setLoading(true);
    try {
      await apiClient.workflowsSchema.delete(id);
      localStorage.removeItem(getTempWorkflowKey(id));
      snackbar.success("Assunto removido com sucesso");
      navigate("/workflows-schema");
    } catch (error) {
      console.error("Error deleting workflow:", error);
      snackbar.error("Erro ao remover assunto");
    }
    setLoading(false);
  };

  const handleSave = async (commitMessage?: string) => {
    if (!workflowSchema) return;

    try {
      if (!commitMessage) {
        const message = await prompt(
          id === "new"
            ? "Insira uma mensagem descrevendo o novo assunto"
            : "Insira a mensagem de alteração da versão"
        );

        if (!message?.trim()) {
          return;
        }
        commitMessage = message;
      }

      setLoading(true);

      const saveData = {
        label: workflowSchema.label,
        description: workflowSchema.description,
        commit: commitMessage,
        activities: workflowSchema.schema.activities,
        plugins: workflowSchema.schema.plugins,
        code: workflowSchema.schema.code,
        constants: workflowSchema.schema.constants,
        incoming: workflowSchema.schema.incoming,
        outgoing: workflowSchema.schema.outgoing,
        hooks: workflowSchema.schema.hooks,
        control:
          Object.keys(workflowSchema.schema.control ?? {}).length > 0
            ? workflowSchema.schema.control
            : {
                accessLevel: PrivacyLevelEnum.PUBLIC,
              },
      };

      if (id !== "new") {
        await apiClient.workflowsSchema.update(id!, saveData);
        await fetchVersions(id!);
        localStorage.removeItem(getTempWorkflowKey(id!));
        localStorage.removeItem(getLastUpdateKey(id!));
        setIsLocalDraft(false);
        snackbar.success("Sucesso ao salvar o assunto");
      } else {
        const response = await apiClient.workflowsSchema.create(saveData);
        const tempId = getNewSubjectId();
        localStorage.removeItem(getTempWorkflowKey(tempId));
        localStorage.removeItem(getLastUpdateKey(tempId));
        clearNewSubjectId();
        setIsLocalDraft(false);
        navigate(`/workflows-schema/${response.id}/`);
        await fetchVersions(response.id);
        snackbar.success("Assunto criado com sucesso");
      }
    } catch (error) {
      snackbar.unexpectedError();
      console.error(error);
    }

    setLoading(false);
  };

  const handleDiscardDraft = async () => {
    if (!id) return;

    const response = await confirmation(
      "Tem certeza que deseja descartar todas as alterações locais não salvas?"
    );

    if (!response) {
      return;
    }

    setLoading(true);
    try {
      // Clear all state first
      setWorkflowSchema(undefined);
      setSelectedActivityIndex(0);
      setContext({});
      setValid({});
      setIsLocalDraft(false);

      // Clear localStorage
      const storageId = id === "new" ? getNewSubjectId() : id;
      localStorage.removeItem(getTempWorkflowKey(storageId));
      localStorage.removeItem(getLastUpdateKey(storageId));

      if (id === "new") {
        clearNewSubjectId();
        navigate("/workflows-schema/");
        return;
      }

      // Small delay to ensure localStorage is cleared
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Fetch fresh data
      await fetchSubject();
    } catch (error) {
      console.error("Error discarding draft:", error);
      snackbar.unexpectedError();
    } finally {
      setLoading(false);
    }
  };

  const handlePublishToHomolog = async () => {
    if (!id || id === "new") return;

    const commitMessage = await prompt(
      "Insira a mensagem de publicação em homologação:"
    );
    if (!commitMessage?.trim()) return;

    try {
      setLoading(true);
      const versionInfo = versionInfos[0]; // Get latest version
      if (!versionInfo) {
        snackbar.error("Nenhuma versão encontrada para publicar");
        return;
      }
      await apiClient.workflowsSchema.publish(id, {
        stage: "staging",
        workflowVersionId: versionInfo.id,
      });
      snackbar.success("Publicado em homologação com sucesso");
    } catch (error) {
      console.error("Error publishing to homolog:", error);
      snackbar.error("Erro ao publicar em homologação");
    } finally {
      setLoading(false);
    }
  };

  const handlePublishToProduction = async () => {
    if (!id || id === "new") return;

    const commitMessage = await prompt(
      "Insira a mensagem de publicação em produção:"
    );
    if (!commitMessage?.trim()) return;

    try {
      setLoading(true);
      const versionInfo = versionInfos[0]; // Get latest version
      if (!versionInfo) {
        snackbar.error("Nenhuma versão encontrada para publicar");
        return;
      }
      await apiClient.workflowsSchema.publish(id, {
        stage: "production",
        workflowVersionId: versionInfo.id,
      });
      snackbar.success("Publicado em produção com sucesso");
    } catch (error) {
      console.error("Error publishing to production:", error);
      snackbar.error("Erro ao publicar em produção");
    } finally {
      setLoading(false);
    }
  };

  // Add function to handle workflow-level permission updates
  const handleUpdateWorkflowPermissions = (permissions: {
    users: { id: string; name: string; access: "read" | "write" }[];
    roles: { id: string; name: string; access: "read" | "write" }[];
    groups: { id: string; name: string; access: "read" | "write" }[];
  }) => {
    if (!workflowSchema) return;

    updateSubject({
      ...workflowSchema,
      schema: {
        ...workflowSchema.schema,
        control: {
          accessLevel:
            workflowSchema.schema?.control?.accessLevel ??
            PrivacyLevelEnum.PUBLIC,
          permissions,
        },
      },
    });
  };

  // Add function to handle workflow access level changes
  const handleUpdateWorkflowAccessLevel = (accessLevel: PrivacyLevelEnum) => {
    if (!workflowSchema) return;

    updateSubject({
      ...workflowSchema,
      schema: {
        ...workflowSchema.schema,
        control: {
          ...workflowSchema.schema?.control,
          accessLevel,
        },
      },
    });
  };

  useEffect(() => {
    fetchSubject();
  }, []);

  useEffect(() => {
    setEditorGeneral((prev) => ({
      ...prev,
      $data: context,
    }));
  }, [context]);

  // Add a new useEffect to refresh secondary data when switching to the activities tab
  useEffect(() => {
    // Only refresh when switching to the activities tab and we have a workflow schema
    if (selectedTab === "activities" && workflowSchema) {
      // Refresh secondary data to get the latest constants and code modules
      fetchSecondaryData(workflowSchema);
    }
  }, [selectedTab]);

  useEffect(() => {
    hotkeyContext.dispatch({
      type: "SET_HOTKEY",
      payload: {
        Q:
          selectedTab === "activities"
            ? withNumberInput((e, index) => {
                // Convert 1-based index from user input to 0-based index for internal use
                const zeroBasedIndex = index !== undefined ? index - 1 : -1;
                if (
                  zeroBasedIndex >= 0 &&
                  workflowSchema?.schema?.activities &&
                  zeroBasedIndex < workflowSchema.schema.activities.length
                ) {
                  setSelectedActivityIndex(zeroBasedIndex);
                }
              })
            : withNoModifiers(() => setSelectedTab("activities")),
        W: withNoModifiers(() => setSelectedTab("incoming")),
        S: withNoModifiers(() => setSelectedTab("outgoing")),
        A: withNoModifiers(() => setSelectedTab("variables")),
        Z: withNoModifiers(() => setSelectedTab("functions")),
        M: () => {
          if (!loading) {
            handleSave();
          }
        },
      },
    });

    return () => {
      hotkeyContext.dispatch({
        type: "UNSET_HOTKEY",
        delete: ["Q", "W", "E", "A", "Z", "M"],
      });
    };
  }, [loading, workflowSchema, selectedTab]);

  const renderActivityEditor = (activity: ActivityTemplate, index: number) => {
    switch (activity.type) {
      case ActivityTypeEnum.FORM: {
        const formTemplate = activity.template as FormTemplate;
        return (
          <FieldEditable
            field={formTemplate.form}
            value={context[activity.namespace]?.form ?? {}}
            context={context[activity.namespace]?.form ?? {}}
            valid={valid[activity.namespace] ?? {}}
            validContext={valid[activity.namespace] ?? {}}
            onChange={(value) =>
              setContext({
                ...context,
                [activity.namespace]: {
                  id: context[activity.namespace]?.id || uuidv4(),
                  state: ActivityStateEnum.CREATED,
                  createdAt:
                    context[activity.namespace]?.createdAt || new Date(),
                  createdBy: editorGeneral.$user?.id || "unknown",
                  form: value,
                },
              })
            }
            onConfigChange={(field) =>
              handleUpdateActivity(index, { template: { form: field } })
            }
            onRemove={() => handleRemoveActivity(index)}
            onValidChange={(valid) =>
              setValid({
                ...valid,
                [activity.namespace]: valid,
              })
            }
            general={editorGeneral}
          />
        );
      }
      case ActivityTypeEnum.DOCUMENT:
        return (
          <ActivityDocumentEditor
            documents={(activity.template as DocumentTemplate).documents}
            general={editorGeneral}
            onChange={(newDocuments) => {
              handleUpdateActivity(index, {
                template: {
                  documents: newDocuments,
                } as DocumentTemplate,
              });
            }}
          />
        );
      case ActivityTypeEnum.SIGNATURE: {
        const signatureTemplate = activity.template as SignaturesTemplate;
        return (
          <div>
            <ActivitySignatureEditor
              signatures={signatureTemplate.signatures}
              general={editorGeneral}
              onChange={(newSignatures) => {
                handleUpdateActivity(index, {
                  template: {
                    signatures: newSignatures,
                  } as SignaturesTemplate,
                });
              }}
            />
          </div>
        );
      }
      case ActivityTypeEnum.TAX:
        return (
          <ActivityTaxEditor
            activity={activity}
            context={{}}
            general={editorGeneral}
            onChange={(value) => {
              handleUpdateActivity(index, {
                template: value.template,
              });
            }}
          />
        );
      default:
        return <div>Activity type not supported</div>;
    }
  };

  const selectedActivity =
    workflowSchema?.schema?.activities?.[selectedActivityIndex];

  return (
    <>
      <div className="flex flex-col space-y-6 mb-24 px-6">
        {loading ? (
          <div className="pt-10 text-center">
            <Spinner size="xl" />
          </div>
        ) : (
          workflowSchema && (
            <>
              <div className="flex items-start">
                {/* Left spacer with control button */}
                <div className="w-48 flex-shrink-0 flex justify-start items-start">
                  <Tooltip
                    label="Configurações avançadas do assunto"
                    placement="top"
                    hasArrow
                  >
                    <button
                      onClick={() => setShowConfigDrawer(true)}
                      className={`px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                        styleContext.state.buttonHoverColorWeight === "200"
                          ? "bg-purple-100 hover:bg-purple-200 text-purple-800"
                          : "bg-purple-900 hover:bg-purple-800 text-purple-100"
                      }`}
                      aria-label="Configurações avançadas"
                    >
                      <FaCog size={16} />
                    </button>
                  </Tooltip>
                </div>
                <div className="flex-grow flex flex-col items-center">
                  {isLocalDraft && (
                    <div className="mb-4 flex items-center justify-center space-x-4">
                      <div
                        className={`flex items-center px-4 py-2 rounded-lg ${
                          styleContext.state.buttonHoverColorWeight === "200"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-yellow-900 text-yellow-200"
                        }`}
                      >
                        <FaExclamationTriangle className="mr-2" size={14} />
                        <Tooltip label="Este rascunho está salvo apenas neste dispositivo e navegador. As alterações serão perdidas se você limpar os dados do navegador ou acessar de outro dispositivo. Use o botão Salvar para enviar as alterações ao servidor ou Descartar para remover as alterações locais.">
                          <span>Rascunho salvo apenas neste dispositivo</span>
                        </Tooltip>
                      </div>
                      <button
                        onClick={handleDiscardDraft}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                          styleContext.state.buttonHoverColorWeight === "200"
                            ? "bg-gray-500 hover:bg-gray-600 text-white"
                            : "bg-gray-800 hover:bg-gray-700 text-gray-200"
                        }`}
                      >
                        <FaTrash size={14} />
                        <span>Descartar Rascunho</span>
                      </button>
                    </div>
                  )}
                  <div className="mb-4">
                    <EditableHeader
                      value={workflowSchema.label ?? ""}
                      onTextChange={(text) => {
                        updateSubject({ ...workflowSchema, label: text });
                      }}
                      className="text-xl md:text-3xl font-medium text-center"
                      style={{ color: styleContext.state.textColor }}
                    />
                  </div>
                  <EditableHeader
                    html={workflowSchema.description ?? ""}
                    onTextChange={(text) => {
                      updateSubject({ ...workflowSchema, description: text });
                    }}
                    className="mb-2 text-center max-h-48 overflow-y-auto"
                    style={{ color: styleContext.state.textColor }}
                  />
                </div>
                {/* Version menu */}
                <div className="w-48 flex-shrink-0">
                  {id !== "new" && (
                    <div className="w-48">
                      <VersionsMenu
                        versions={versionInfos}
                        defaultVersion={currentVersion}
                        callback={fetchSubjectVersion}
                        loading={loadingVersions}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex">
                <div className="w-1/4 border-r pr-4">
                  <div className="mb-6">
                    <h2
                      className="text-xl font-bold mb-4"
                      style={{ color: styleContext.state.textColor }}
                    >
                      Configuração
                    </h2>
                    <div className="space-y-2">
                      {tabConfig.map((tab) => (
                        <div
                          key={tab.id}
                          className={`p-3 border rounded cursor-pointer transition-colors duration-150 ${
                            selectedTab === tab.id
                              ? styleContext.state.buttonHoverColorWeight ===
                                "200"
                                ? "bg-gray-200"
                                : "bg-gray-700"
                              : ""
                          }`}
                          onClick={() => setSelectedTab(tab.id)}
                          style={{
                            backgroundColor:
                              selectedTab === tab.id
                                ? styleContext.state.buttonHoverColorWeight ===
                                  "200"
                                  ? "#E5E7EB"
                                  : "#374151"
                                : styleContext.state.backgroundColor,
                            borderColor:
                              styleContext.state.buttonHoverColorWeight ===
                              "200"
                                ? "#E5E7EB"
                                : "#374151",
                          }}
                          onMouseEnter={(e) => {
                            if (selectedTab !== tab.id) {
                              const colorWeight =
                                styleContext.state.buttonHoverColorWeight;
                              const hoverColor =
                                colorWeight === "200"
                                  ? "#F3F4F6"
                                  : colorWeight === "800"
                                    ? "#4B5563"
                                    : styleContext.state.backgroundColor;
                              e.currentTarget.style.backgroundColor =
                                hoverColor;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedTab !== tab.id) {
                              e.currentTarget.style.backgroundColor =
                                styleContext.state.backgroundColor;
                            }
                          }}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center space-x-2">
                              {tab.icon}
                              <span
                                style={{ color: styleContext.state.textColor }}
                              >
                                {tab.label}
                              </span>
                            </div>
                            <SL>{tab.shortcut}</SL>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <Tooltip label="Visualize a estrutura completa do assunto em formato JSON, incluindo todas as configurações, atividades e propriedades">
                      <button
                        onClick={() => setShowWorkflowJson(true)}
                        className="w-full px-3 py-2.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg transition-colors flex items-center space-x-2 text-sm"
                        style={{
                          backgroundColor:
                            styleContext.state.backgroundColor === "#000000"
                              ? "#312e81"
                              : undefined,
                          color:
                            styleContext.state.backgroundColor === "#000000"
                              ? "#e0e7ff"
                              : undefined,
                        }}
                      >
                        <FaCode size={14} />
                        <span>Ver JSON do Assunto</span>
                      </button>
                    </Tooltip>
                    <Tooltip label="Visualize os dados atuais do contexto, incluindo os valores preenchidos em todas as atividades e campos do assunto">
                      <button
                        onClick={() => setShowContextData(true)}
                        className="w-full px-3 py-2.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors flex items-center space-x-2 text-sm"
                        style={{
                          backgroundColor:
                            styleContext.state.backgroundColor === "#000000"
                              ? "#5b21b6"
                              : undefined,
                          color:
                            styleContext.state.backgroundColor === "#000000"
                              ? "#f3e8ff"
                              : undefined,
                        }}
                      >
                        <FaDatabase size={14} />
                        <span>Ver Dados do Contexto</span>
                      </button>
                    </Tooltip>
                  </div>

                  {selectedTab === "activities" && (
                    <>
                      <div className="flex justify-between items-center mb-4">
                        <h2
                          className="text-xl font-bold"
                          style={{ color: styleContext.state.textColor }}
                        >
                          Atividades
                        </h2>
                        <Tooltip
                          label="Visualizar grafo de dependências"
                          placement="top"
                          hasArrow
                        >
                          <button
                            onClick={() => setShowDependencyGraph(true)}
                            className={`px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                              styleContext.state.buttonHoverColorWeight ===
                              "200"
                                ? "bg-purple-100 hover:bg-purple-200 text-purple-800"
                                : "bg-purple-900 hover:bg-purple-800 text-purple-100"
                            }`}
                            aria-label="Visualizar dependências"
                          >
                            <FaProjectDiagram size={16} />
                          </button>
                        </Tooltip>
                      </div>
                      <div className="space-y-2">
                        {workflowSchema.schema?.activities?.map(
                          (activity, index) => (
                            <div
                              key={activity.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, index)}
                              onDragOver={(e) => handleDragOver(e, index)}
                              onDrop={handleDrop}
                              className={`p-3 border rounded cursor-pointer transition-colors duration-150 ${
                                selectedActivityIndex === index
                                  ? styleContext.state
                                      .buttonHoverColorWeight === "200"
                                    ? "bg-gray-200"
                                    : "bg-gray-700"
                                  : ""
                              } ${draggingIndex === index ? "opacity-50" : ""}`}
                              onClick={() => setSelectedActivityIndex(index)}
                              style={{
                                backgroundColor:
                                  selectedActivityIndex === index
                                    ? styleContext.state
                                        .buttonHoverColorWeight === "200"
                                      ? "#E5E7EB"
                                      : "#374151"
                                    : styleContext.state.backgroundColor,
                                borderColor:
                                  styleContext.state.buttonHoverColorWeight ===
                                  "200"
                                    ? "#E5E7EB"
                                    : "#374151",
                              }}
                              onMouseEnter={(e) => {
                                if (selectedActivityIndex !== index) {
                                  const colorWeight =
                                    styleContext.state.buttonHoverColorWeight;
                                  const hoverColor =
                                    colorWeight === "200"
                                      ? "#F3F4F6"
                                      : colorWeight === "800"
                                        ? "#4B5563"
                                        : styleContext.state.backgroundColor;
                                  e.currentTarget.style.backgroundColor =
                                    hoverColor;
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (selectedActivityIndex !== index) {
                                  e.currentTarget.style.backgroundColor =
                                    styleContext.state.backgroundColor;
                                }
                              }}
                            >
                              <div className="flex items-center justify-between group w-full">
                                <div className="flex items-center space-x-3 flex-grow">
                                  <div className="text-xl">
                                    <Tooltip
                                      label={getActivityTypeLabel(
                                        activity.type
                                      )}
                                    >
                                      <span>
                                        {getActivityTypeIcon(activity.type)}
                                      </span>
                                    </Tooltip>
                                  </div>
                                  <div className="flex-grow">
                                    <div
                                      className="font-medium"
                                      style={{
                                        color: styleContext.state.textColor,
                                      }}
                                    >
                                      {activity.label || "Sem título"}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {getActivityTypeLabel(activity.type)}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 ml-4">
                                  <IconButton
                                    aria-label="Remover atividade"
                                    icon={<FaTrash />}
                                    size="sm"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveActivity(index);
                                    }}
                                    style={{
                                      backgroundColor:
                                        styleContext.state
                                          .buttonHoverColorWeight === "200"
                                          ? "#F3F4F6"
                                          : "#4B5563",
                                      color: styleContext.state.textColor,
                                    }}
                                  />
                                  <SL>Q+{index + 1}</SL>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                      <div className="mt-4 space-y-2">
                        <ActivityMenuButton
                          onAddActivity={handleAddActivity}
                          buttonClassName="w-full"
                          styleContext={styleContext}
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="w-3/4 pl-4">
                  {loadingSecondary ? (
                    <div className="flex items-center justify-center h-full">
                      <Spinner />
                      <span className="ml-2">Carregando editor...</span>
                    </div>
                  ) : selectedTab === "activities" && selectedActivity ? (
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <EditableHeader
                            value={selectedActivity.label}
                            onTextChange={(text) =>
                              handleUpdateActivity(selectedActivityIndex, {
                                label: text,
                              })
                            }
                            className="text-xl font-bold"
                          />
                          <EditableHeader
                            value={selectedActivity.documentation}
                            onTextChange={(text) =>
                              handleUpdateActivity(selectedActivityIndex, {
                                documentation: text,
                              })
                            }
                            className="text-gray-600"
                          />
                        </div>
                        <button
                          onClick={() =>
                            handleRemoveActivity(selectedActivityIndex)
                          }
                          className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                        >
                          <FaTrash />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-6 mb-6">
                        <FormControl>
                          <FormLabel>Chave</FormLabel>
                          <Input
                            value={selectedActivity.namespace}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) =>
                              handleUpdateActivity(selectedActivityIndex, {
                                namespace: e.target.value,
                              })
                            }
                            placeholder="ex: forms/registration"
                            size="lg"
                          />
                          <FormHelperText>
                            Identificador único para esta atividade
                          </FormHelperText>
                        </FormControl>

                        <FormControl>
                          <FormLabel>Nível de Acesso</FormLabel>
                          <Select
                            value={selectedActivity.accessLevel}
                            onChange={(
                              e: React.ChangeEvent<HTMLSelectElement>
                            ) =>
                              handleUpdateActivity(selectedActivityIndex, {
                                accessLevel: Number(
                                  e.target.value
                                ) as PrivacyLevelEnum,
                              })
                            }
                            size="lg"
                          >
                            <option value={PrivacyLevelEnum.PUBLIC}>
                              Público
                            </option>
                            <option value={PrivacyLevelEnum.REGISTERED}>
                              Registrado
                            </option>
                            <option value={PrivacyLevelEnum.RESTRICTED}>
                              Restrito
                            </option>
                            <option value={PrivacyLevelEnum.CONFIDENTIAL}>
                              Confidencial
                            </option>
                            <option value={PrivacyLevelEnum.ANONYMIZED}>
                              Anônimo
                            </option>
                          </Select>
                          <FormHelperText>
                            Define quem pode acessar esta atividade
                          </FormHelperText>
                        </FormControl>
                      </div>

                      <div className="flex space-x-6 mb-6">
                        <ActivityDependenciesSelector
                          activities={workflowSchema?.schema?.activities || []}
                          selectedDependencies={
                            selectedActivity.dependsOn || []
                          }
                          onChange={(dependencies) =>
                            handleUpdateActivity(selectedActivityIndex, {
                              dependsOn: dependencies,
                            })
                          }
                          styleContext={styleContext}
                          currentActivityId={selectedActivity.id}
                        />
                        <PermissionsSelector
                          permissions={selectedActivity.permissions}
                          onChange={(permissions) =>
                            handleUpdatePermissions(
                              selectedActivityIndex,
                              permissions
                            )
                          }
                          styleContext={styleContext}
                          title="Permissões de Acesso ao Assunto"
                          parentDrawerId={configDrawerId}
                        />
                      </div>

                      {renderActivityEditor(
                        selectedActivity,
                        selectedActivityIndex
                      )}
                    </div>
                  ) : selectedTab === "incoming" ? (
                    <div className="w-full space-y-8">
                      <WorkflowDependencies
                        incoming={workflowSchema.schema.incoming || []}
                        general={editorGeneral}
                        currentWorkflowId={id || ""}
                        onChange={(newIncoming: Incoming[]) =>
                          updateSubject({
                            ...workflowSchema,
                            schema: {
                              ...workflowSchema.schema,
                              incoming: newIncoming,
                            },
                          })
                        }
                      />
                    </div>
                  ) : selectedTab === "outgoing" ? (
                    <div className="w-full">
                      <WorkflowOutgoingDependencies
                        outgoing={workflowSchema.schema.outgoing || []}
                        general={editorGeneral}
                        currentWorkflowId={id || ""}
                        activities={workflowSchema.schema.activities || []}
                        onChange={(newOutgoing: Outgoing[]) =>
                          updateSubject({
                            ...workflowSchema,
                            schema: {
                              ...workflowSchema.schema,
                              outgoing: newOutgoing,
                            },
                          })
                        }
                      />
                    </div>
                  ) : selectedTab === "variables" ? (
                    <div className="w-full">
                      <WorkflowConstants
                        constants={workflowSchema.schema.constants}
                        onConstantsChange={(newConstants) =>
                          updateSubject({
                            ...workflowSchema,
                            schema: {
                              ...workflowSchema.schema,
                              constants: newConstants,
                            },
                          })
                        }
                      />
                    </div>
                  ) : selectedTab === "functions" ? (
                    <div className="w-full">
                      <WorkflowLibrary
                        codeModules={workflowSchema.schema.code}
                        onCodeModulesChange={(newModules) =>
                          updateSubject({
                            ...workflowSchema,
                            schema: {
                              ...workflowSchema.schema,
                              code: newModules,
                            },
                          })
                        }
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64">
                      <FaWpforms size={48} className="text-gray-400 mb-4" />
                      <p className="text-gray-500 text-lg mb-6">
                        Crie uma nova atividade para começar a editar
                      </p>
                      <ActivityMenuButton
                        onAddActivity={handleAddActivity}
                        styleContext={styleContext}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="fixed bottom-16 right-4 flex space-x-4">
                {id !== "new" && (
                  <>
                    <button
                      onClick={handleDelete}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg shadow-lg flex items-center space-x-2"
                      disabled={loading}
                      style={{
                        backgroundColor:
                          styleContext.state.backgroundColor === "#000000"
                            ? "#dc2626"
                            : undefined,
                        color: "#ffffff",
                      }}
                    >
                      <FaTrash size={14} />
                      <span>Remover</span>
                    </button>
                    <div className="flex">
                      <button
                        className="bg-yellow-600 hover:bg-yellow-700 text-white pl-6 pr-2 py-2.5 rounded-l-lg shadow-lg flex items-center space-x-2"
                        onClick={() => handleSave()}
                        disabled={loading}
                        style={{
                          backgroundColor:
                            styleContext.state.backgroundColor === "#000000"
                              ? "#d97706"
                              : undefined,
                          color: "#ffffff",
                        }}
                      >
                        <FaSave size={14} />
                        <span>
                          {isLocalDraft ? "Salvar Rascunho" : "Salvar"}
                        </span>{" "}
                        <SL bg="yellow.600">M</SL>
                      </button>
                      <Menu>
                        <MenuButton
                          as="button"
                          className="px-4 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-r-lg flex items-center justify-center space-x-2"
                          style={{
                            backgroundColor:
                              styleContext.state.backgroundColor === "#000000"
                                ? "#d97706"
                                : undefined,
                          }}
                        >
                          <div className="flex items-center space-x-2">
                            <FaChevronDown size={12} />
                          </div>
                        </MenuButton>
                        <MenuList
                          zIndex={"overlay"}
                          bg={
                            styleContext.state.buttonHoverColorWeight === "200"
                              ? "white"
                              : "gray.800"
                          }
                          maxHeight="300px"
                          overflowY="auto"
                          boxShadow="lg"
                          border="1px solid"
                          borderColor={
                            styleContext.state.buttonHoverColorWeight === "200"
                              ? "gray.200"
                              : "gray.600"
                          }
                          py={2}
                        >
                          {[
                            {
                              key: "publishToHomolog",
                              callback: handlePublishToHomolog,
                              label: "Homologar",
                              icon: <FaFlask size={14} />,
                            },
                            {
                              key: "publishToProduction",
                              callback: handlePublishToProduction,
                              label: "Produção",
                              icon: <FaRocket size={14} />,
                            },
                          ].map((item) => (
                            <MenuItem
                              key={item.key}
                              onClick={() => item.callback()}
                              className="flex items-center space-x-2"
                              bg={
                                styleContext.state.buttonHoverColorWeight ===
                                "200"
                                  ? "white"
                                  : "gray.800"
                              }
                              _hover={{
                                bg:
                                  styleContext.state.buttonHoverColorWeight ===
                                  "200"
                                    ? "gray.100"
                                    : "gray.700",
                              }}
                              px={4}
                              py={2}
                            >
                              {item.icon}
                              <span
                                style={{
                                  color: styleContext.state.textColor,
                                }}
                              >
                                {item.label}
                              </span>
                            </MenuItem>
                          ))}
                        </MenuList>
                      </Menu>
                    </div>
                  </>
                )}
                {id === "new" && (
                  <button
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2.5 rounded-lg shadow-lg flex items-center space-x-2"
                    onClick={() => handleSave()}
                    disabled={loading}
                    style={{
                      backgroundColor:
                        styleContext.state.backgroundColor === "#000000"
                          ? "#d97706"
                          : undefined,
                      color: "#ffffff",
                    }}
                  >
                    <FaSave size={14} />
                    <span>Criar Assunto</span> <SL bg="yellow.600">M</SL>
                  </button>
                )}
              </div>
            </>
          )
        )}
      </div>

      <CodeViewerModal
        isOpen={showWorkflowJson}
        onClose={() => setShowWorkflowJson(false)}
        title="JSON do Assunto"
        code={workflowSchema}
        language="json"
        onSave={async ({ code }) => {
          const newSubject = { ...workflowSchema, ...code };
          updateSubject(newSubject);
          setShowWorkflowJson(false);
        }}
        readOnly={false}
      />

      <CodeViewerModal
        isOpen={showContextData}
        onClose={() => setShowContextData(false)}
        title="Dados do Contexto"
        code={context}
        language="json"
      />

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Conflito de Versões Detectado</ModalHeader>
          <ModalBody>
            <p>
              Existem alterações locais que conflitam com as alterações no
              servidor.
            </p>
            <p className="mt-2">Alterações locais:</p>
            <pre className="bg-gray-100 p-2 mt-1 rounded text-sm">
              {conflictData?.localData.label}
              {conflictData?.localData.description &&
                ` - ${conflictData.localData.description}`}
            </pre>
            <p className="mt-2">Alterações do servidor:</p>
            <pre className="bg-gray-100 p-2 mt-1 rounded text-sm">
              {conflictData?.backendData.label}
              {conflictData?.backendData.description &&
                ` - ${conflictData.backendData.description}`}
            </pre>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              onClick={() => handleConflictResolution(true)}
            >
              Manter Alterações Locais
            </Button>
            <Button
              variant="ghost"
              onClick={() => handleConflictResolution(false)}
            >
              Usar Versão do Servidor
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Dependency Graph Visualization Modal */}
      <DependencyGraphVisualization
        isOpen={showDependencyGraph}
        onClose={() => setShowDependencyGraph(false)}
        activities={workflowSchema?.schema?.activities || []}
        incoming={workflowSchema?.schema?.incoming || []}
        outgoing={workflowSchema?.schema?.outgoing || []}
        styleContext={styleContext}
        currentActivityId={selectedActivity?.id}
      />

      {/* Advanced Configuration Drawer */}
      <SideDrawer
        isOpen={showConfigDrawer}
        onClose={() => setShowConfigDrawer(false)}
        styleContext={styleContext}
        title="Configurações Avançadas do Assunto"
        width="520px"
        id="workflow-control-dialog"
      >
        <div className="px-6 py-4 space-y-8">
          <div>
            <h3
              className="text-lg font-medium mb-4"
              style={{ color: styleContext.state.textColor }}
            >
              Configurações de Acesso
            </h3>

            <FormControl className="mb-6">
              <FormLabel>Nível de Acesso Global</FormLabel>
              <Select
                value={
                  workflowSchema?.schema?.control?.accessLevel ??
                  PrivacyLevelEnum.PUBLIC
                }
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  handleUpdateWorkflowAccessLevel(
                    Number(e.target.value) as PrivacyLevelEnum
                  )
                }
                size="lg"
              >
                <option value={PrivacyLevelEnum.PUBLIC}>Público</option>
                <option value={PrivacyLevelEnum.REGISTERED}>Registrado</option>
                <option value={PrivacyLevelEnum.RESTRICTED}>Restrito</option>
                <option value={PrivacyLevelEnum.CONFIDENTIAL}>
                  Confidencial
                </option>
                <option value={PrivacyLevelEnum.ANONYMIZED}>Anônimo</option>
              </Select>
              <FormHelperText>
                Define o nível de acesso padrão para todo o fluxo de trabalho
              </FormHelperText>
            </FormControl>

            <div className="mt-8">
              <PermissionsSelector
                showBorder={false}
                permissions={workflowSchema?.schema?.control?.permissions}
                onChange={handleUpdateWorkflowPermissions}
                styleContext={styleContext}
                title="Permissões de Acesso ao Assunto"
                helperText="Defina quais usuários, papéis ou grupos podem acessar este assunto"
                parentDrawerId={configDrawerId}
              />
            </div>
          </div>
        </div>
      </SideDrawer>
    </>
  );
}
