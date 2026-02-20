import { getAccessToken } from "../../auth/token";
import React, { useContext, useEffect, useState } from "react";
import { Input, SL } from "../../components";
import { HotkeyContext } from "../../reducers/hotkeys.reducer";
import { StyleContext } from "../../reducers/style.reducer";
import { BsFillGridFill } from "react-icons/bs";
import {
  FaEdit,
  FaPlus,
  FaThList,
  FaSearch,
  FaCode,
  FaRocket,
  FaFlask,
  FaTimes,
  FaClone,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@chakra-ui/react";
import { ApiClient } from "../../api";
import { WorkflowSchema } from "../../api/types/workflows-schema.dto";
import { CacheOptions } from "../../api/services/cache.service";
import { PermissionGate } from "../../components/PermissionGate";
import { usePermissions } from "../../reducers/permission.context";
import { AuthContext } from "../../reducers/auth.reducer";

// Create API client factory that uses current token
const createApiClient = () => {
  const token = getAccessToken();
  return new ApiClient({
    baseURL: import.meta.env.VITE_BACK_END_API || "",
    headers: token
      ? { authorization: `Bearer ${token}` }
      : {},
  });
};

export const WorkflowsSchema: React.FC = () => {
  const hotkeyContext = useContext(HotkeyContext);
  const styleContext = useContext(StyleContext);
  const { isAuthenticated, signIn } = useContext(AuthContext);
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canEditWorkflowSchema = hasPermission("workflow-schema:write:update");
  const canCreateWorkflow = hasPermission("workflow:write:create");

  const [workflows, setWorkflows] = useState<WorkflowSchema[]>([]);
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState(
    canEditWorkflowSchema ? "development" : "production"
  );
  const [isGridView, setIsGridView] = useState(
    localStorage.getItem("listView") !== "true"
  );
  const [loading, setLoading] = useState(true);
  const showEdit = !localStorage.getItem("showEdit");
  const [selectedDescription, setSelectedDescription] = useState<{
    text: string;
    label: string;
    id: string;
  } | null>(null);

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const workflows = await createApiClient().workflowsSchema.findAll(stage);
      setWorkflows(workflows.sort((a, b) => a.label.localeCompare(b.label)));
    } catch (error) {
      console.error("Error fetching workflows:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWorkflows();
    
  }, [stage]);

  useEffect(() => {
    if (workflows.length === 0) {
      fetchWorkflows();
    }

    hotkeyContext.dispatch({ type: "SET_HOTKEY", payload: buildHotkeys() });

    return () => {
      hotkeyContext.dispatch({
        type: "UNSET_HOTKEY",
        delete: ["N", "G", "T", "S", "E"],
      });
    };
    
  }, [workflows]);

  const buildHotkeys = () => ({
    N: () => showEdit && navigate("/workflows-schema/new"),
    G: () => setView(false),
    T: () => setView(true),
    S: () => handlePromptIndex(handleRequest),
    E: () => handlePromptIndex(handEditWorkflows),
    D: () => handlePromptIndex(handleDuplicate),
  });

  const setView = (listView: boolean) => {
    localStorage.setItem("listView", listView.toString());
    setIsGridView(!listView);
  };

  const handlePromptIndex = async (handler: (id: string) => void) => {
    const index = await prompt("Insira o índice do assunto:");

    if (
      index !== "" &&
      index !== undefined &&
      index !== null &&
      Number(index) > 0 &&
      workflows[Number(index) - 1]
    ) {
      handler(workflows[Number(index) - 1].id);
    }
  };

  const handleRequest = (workflowId: string) => {
    if (!isAuthenticated) {
      sessionStorage.setItem(
        "postLoginRedirectPath",
        `/workflows/${workflowId}/create?stage=${stage}`,
      );
      signIn();
      return;
    }

    navigate(`/workflows/${workflowId}/create?stage=${stage}`);
  };

  const handEditWorkflows = (workflowId: string) =>
    navigate(`/workflows-schema/${workflowId}`);

  const handleDuplicate = async (workflowId: string) => {
    setLoading(true);
    try {
      const newWorkflow = await createApiClient().workflowsSchema.copy(workflowId);
      setWorkflows([...workflows, newWorkflow]);
    } catch (error) {
      console.error("Error duplicating workflow:", error);
    }
    setLoading(false);
  };

  const filteredWorkflows = workflows.filter((workflow) =>
    workflow.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col space-y-8 mb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1
        className="text-2xl md:text-3xl font-medium mt-6"
        style={{ color: styleContext.state.textColor }}
      >
        Carta de Assuntos
      </h1>
      {showEdit && <StageSelectorButton stage={stage} setStage={setStage} />}
      {loading ? (
        <LoadingSpinner styleContext={styleContext} />
      ) : (
        <>
          <div className="flex justify-between items-center">
            <div className="flex-grow flex justify-between items-center space-x-4">
              <div className="flex-grow relative">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <FaSearch
                      className={
                        styleContext.state.buttonHoverColorWeight === "200"
                          ? "text-gray-500"
                          : "text-gray-300"
                      }
                      size={16}
                    />
                  </div>
                  <Input
                    type="text"
                    placeholder="Buscar assunto..."
                    size="lg"
                    value={search}
                    onChange={(e: any) => setSearch(e.target.value)}
                    className={`w-full pl-10 transition-all duration-200 ${
                      styleContext.state.buttonHoverColorWeight === "200"
                        ? "focus:ring-2 focus:ring-yellow-200 border-gray-200"
                        : "focus:ring-2 focus:ring-yellow-600 border-gray-600 bg-gray-800"
                    }`}
                    style={{
                      color: styleContext.state.textColor,
                      paddingLeft: "2.5rem",
                    }}
                  />
                </div>
              </div>
              <ViewButtons
                isGridView={isGridView}
                setView={setView}
                styleContext={styleContext}
              />
            </div>
          </div>
          <WorkflowContent
            stage={stage}
            setStage={setStage}
            showEdit={showEdit}
            isGridView={isGridView}
            isAuthenticated={isAuthenticated}
            canCreateWorkflow={canCreateWorkflow}
            filteredWorkflows={filteredWorkflows}
            handleRequest={handleRequest}
            handEditWorkflows={handEditWorkflows}
            handleDuplicate={handleDuplicate}
            styleContext={styleContext}
            setSelectedDescription={setSelectedDescription}
          />
        </>
      )}
      <Modal
        isOpen={!!selectedDescription}
        onClose={() => setSelectedDescription(null)}
        motionPreset="slideInBottom"
        isCentered
      >
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent
          className="shadow-xl"
          style={{
            backgroundColor: styleContext.state.backgroundColor,
            maxWidth: "600px",
          }}
        >
          <ModalHeader className="px-6 pt-4 pb-4 border-b">
            <div className="flex justify-between">
              <span
                className="text-xl font-bold mt-2 mr-3"
                style={{ color: styleContext.state.textColor }}
              >
                {selectedDescription?.label}
              </span>
              <div>
                <button
                  onClick={() => setSelectedDescription(null)}
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
                </button>
              </div>
            </div>
          </ModalHeader>
          <ModalBody className="px-6 py-6 overflow-y-auto">
            <div
              className="prose dark:prose-invert max-w-none"
              style={{ color: styleContext.state.textColor }}
              dangerouslySetInnerHTML={{
                __html: selectedDescription?.text || "",
              }}
            />
          </ModalBody>
          <ModalFooter className="px-6 pt-4 pb-4 border-t space-x-3">
            <button
              className="px-6 py-2.5 rounded-lg font-medium text-white transition-colors flex items-center space-x-2"
              onClick={() => {
                setSelectedDescription(null);
                if (selectedDescription) {
                  handleRequest(selectedDescription.id);
                }
              }}
              style={{
                backgroundColor:
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "#eab308"
                    : "#854d0e",
              }}
            >
              <span>Solicitar</span>
              <SL
                bg={
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "yellow.600"
                    : "yellow.800"
                }
              >
                Enter
              </SL>
            </button>
            <button
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
              <SL
                bg={
                  styleContext.state.buttonHoverColorWeight === "200"
                    ? "gray.100"
                    : "gray.600"
                }
              >
                esc
              </SL>
            </button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

const LoadingSpinner = ({ styleContext }: { styleContext: any }) => {
  return (
    <div className="flex flex-col items-center justify-center pt-10 space-y-4">
      <Spinner
        size="xl"
        color={
          styleContext.state.buttonHoverColorWeight === "200"
            ? "yellow.500"
            : "yellow.300"
        }
        thickness="3px"
      />
      <span style={{ color: styleContext.state.textColor }}>
        Carregando assuntos...
      </span>
    </div>
  );
};

const WorkflowContent = ({
  stage,
  setStage,
  showEdit,
  isGridView,
  isAuthenticated,
  canCreateWorkflow,
  filteredWorkflows,
  handleRequest,
  handEditWorkflows,
  handleDuplicate,
  styleContext,
  setSelectedDescription,
}: {
  stage: string;
  setStage: (stage: string) => void;
  showEdit: boolean;
  isGridView: boolean;
  isAuthenticated: boolean;
  canCreateWorkflow: boolean;
  filteredWorkflows: any[];
  handleRequest: (workflowId: string) => void;
  handEditWorkflows: (workflowId: string) => void;
  handleDuplicate: (workflowId: string) => Promise<void>;
  styleContext: any;
  setSelectedDescription: (
    desc: { text: string; label: string; id: string } | null
  ) => void;
}) => {
  return (
    <WorkflowsList
      filteredWorkflows={filteredWorkflows}
      isAuthenticated={isAuthenticated}
      canCreateWorkflow={canCreateWorkflow}
      handleRequest={handleRequest}
      handEditWorkflows={handEditWorkflows}
      handleDuplicate={handleDuplicate}
      isGridView={isGridView}
      showEdit={showEdit}
      styleContext={styleContext}
      setSelectedDescription={setSelectedDescription}
    />
  );
};

const StageSelectorButton = ({
  stage,
  setStage,
}: {
  stage: string;
  setStage: (stage: string) => void;
}) => {
  const styleContext = useContext(StyleContext);
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canEditWorkflowSchema = hasPermission("workflow-schema:write:update");

  return (
    <div className="flex justify-between items-center w-full">
      <div className="flex items-center space-x-2">
        {canEditWorkflowSchema ? (
          <>
            <button
              onClick={() => setStage("development")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 font-medium ${
                stage === "development"
                  ? styleContext.state.buttonHoverColorWeight === "200"
                    ? "bg-gray-200 text-gray-800"
                    : "bg-gray-700 text-gray-200"
                  : styleContext.state.buttonHoverColorWeight === "200"
                    ? "text-gray-600 hover:bg-gray-100"
                    : "text-gray-400 hover:bg-gray-700"
              }`}
            >
              <FaCode size={16} />
              <span>Desenvolvimento</span>
            </button>
            <button
              onClick={() => setStage("staging")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 font-medium ${
                stage === "staging"
                  ? styleContext.state.buttonHoverColorWeight === "200"
                    ? "bg-gray-200 text-gray-800"
                    : "bg-gray-700 text-gray-200"
                  : styleContext.state.buttonHoverColorWeight === "200"
                    ? "text-gray-600 hover:bg-gray-100"
                    : "text-gray-400 hover:bg-gray-700"
              }`}
            >
              <FaFlask size={16} />
              <span>Homologação</span>
            </button>
            <button
              onClick={() => setStage("production")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 font-medium ${
                stage === "production"
                  ? styleContext.state.buttonHoverColorWeight === "200"
                    ? "bg-gray-200 text-gray-800"
                    : "bg-gray-700 text-gray-200"
                  : styleContext.state.buttonHoverColorWeight === "200"
                    ? "text-gray-600 hover:bg-gray-100"
                    : "text-gray-400 hover:bg-gray-700"
              }`}
            >
              <FaRocket size={16} />
              <span>Produção</span>
            </button>
          </>
        ) : null}
      </div>
      <PermissionGate permission="workflow-schema:write:create">
        <button
          onClick={() => navigate("/workflows-schema/new")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 font-medium ${
            styleContext.state.buttonHoverColorWeight === "200"
              ? "bg-yellow-500 hover:bg-yellow-600 text-white"
              : "bg-yellow-600 hover:bg-yellow-700 text-white"
          }`}
        >
          <FaPlus size={16} />
          <span>Assunto</span>
          <span className="text-sm opacity-75 ml-2">
            <SL
              bg={
                styleContext.state.buttonHoverColorWeight === "200"
                  ? "yellow.600"
                  : "yellow.700"
              }
            >
              N
            </SL>
          </span>
        </button>
      </PermissionGate>
    </div>
  );
};

const WorkflowsList = ({
  filteredWorkflows,
  isAuthenticated,
  canCreateWorkflow,
  handleRequest,
  handEditWorkflows,
  handleDuplicate,
  isGridView,
  showEdit,
  styleContext,
  setSelectedDescription,
}: {
  filteredWorkflows: any[];
  isAuthenticated: boolean;
  canCreateWorkflow: boolean;
  handleRequest: (workflowId: string) => void;
  handEditWorkflows: (workflowId: string) => void;
  handleDuplicate: (workflowId: string) => Promise<void>;
  isGridView: boolean;
  showEdit: boolean;
  styleContext: any;
  setSelectedDescription: (
    desc: { text: string; label: string; id: string } | null
  ) => void;
}) => {
  const [columns, setColumns] = useState(() => {
    // Simplified column logic for this component
    if (window.innerWidth > 1280) return "grid-cols-4";
    if (window.innerWidth > 820) return "grid-cols-3";
    if (window.innerWidth > 560) return "grid-cols-2";
    return "grid-cols-1";
  });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1280) setColumns("grid-cols-4");
      else if (window.innerWidth > 820) setColumns("grid-cols-3");
      else if (window.innerWidth > 560) setColumns("grid-cols-2");
      else setColumns("grid-cols-1");
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      className={
        filteredWorkflows.length > 0
          ? isGridView
            ? `grid gap-4 ${columns}`
            : "flex flex-col space-y-4"
          : "h-[calc(100vh-400px)] flex items-center justify-center"
      }
    >
      {filteredWorkflows.map((workflow, index) => (
        <div
          key={workflow.id}
          className={`group p-4 rounded-lg border transition-all duration-200 ${
            isGridView ? "hover:shadow-md" : "hover:bg-opacity-50"
          } ${
            styleContext.state.buttonHoverColorWeight === "200"
              ? "border-gray-200 hover:border-yellow-400 hover:bg-gray-50"
              : "border-gray-700 hover:border-yellow-500 hover:bg-gray-800"
          }`}
          style={{ backgroundColor: styleContext.state.backgroundColor }}
        >
          <div
            className={`flex ${
              isGridView ? "flex-col h-full" : "space-x-4"
            } justify-between`}
          >
            <div className="flex-grow">
              <div className="flex items-center space-x-2 mb-2">
                <h3
                  className="font-medium text-lg"
                  style={{ color: styleContext.state.textColor }}
                >
                  {workflow.label}
                </h3>
              </div>
              <div className="relative">
                <div
                  className={`text-sm ${
                    styleContext.state.buttonHoverColorWeight === "200"
                      ? "text-gray-600"
                      : "text-gray-400"
                  }`}
                >
                  <div
                    className={`${workflow.description.length > 100 ? "line-clamp-3" : ""}`}
                    dangerouslySetInnerHTML={{
                      __html: workflow.description,
                    }}
                  />
                  {workflow.description.length > 100 && (
                    <button
                      onClick={() =>
                        setSelectedDescription({
                          text: workflow.description,
                          label: workflow.label,
                          id: workflow.id,
                        })
                      }
                      className={`text-sm mt-1 ${
                        styleContext.state.buttonHoverColorWeight === "200"
                          ? "text-blue-600 hover:text-blue-700"
                          : "text-blue-400 hover:text-blue-300"
                      }`}
                    >
                      Ver mais
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div
              className={`flex ${
                isGridView
                  ? "flex-col space-y-3 mt-auto pt-4"
                  : "items-center space-x-3"
              }`}
            >
              {(canCreateWorkflow || !isAuthenticated) && (
                <button
                  onClick={() => handleRequest(workflow.id)}
                  className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg transition-colors duration-200 font-medium min-w-[160px] justify-center ${
                    styleContext.state.buttonHoverColorWeight === "200"
                      ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                      : "bg-yellow-600 hover:bg-yellow-700 text-white"
                  }`}
                  title={isAuthenticated ? "Solicitar" : "Entrar para solicitar"}
                >
                  <FaPlus size={18} />
                  <span>Solicitar</span>
                  <SL
                    bg={
                      styleContext.state.buttonHoverColorWeight === "200"
                        ? "yellow.600"
                        : "yellow.700"
                    }
                  >
                    {`S+${index + 1}`}
                  </SL>
                </button>
              )}
              {showEdit && (
                <div
                  className={`flex ${
                    isGridView ? "flex-col space-y-2" : "space-x-2"
                  }`}
                >
                  <PermissionGate permission="workflow-schema:write:update">
                    <button
                      onClick={() => handEditWorkflows(workflow.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                        styleContext.state.buttonHoverColorWeight === "200"
                          ? "text-gray-600 hover:bg-gray-200"
                          : "text-gray-400 hover:bg-gray-700"
                      }`}
                      title="Editar"
                    >
                      <FaEdit size={18} />
                      <span>Editar</span>
                      <SL>{`E+${index + 1}`}</SL>
                    </button>
                  </PermissionGate>
                  <PermissionGate permission="workflow-schema:write:copy">
                    <button
                      onClick={() => handleDuplicate(workflow.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                        styleContext.state.buttonHoverColorWeight === "200"
                          ? "text-gray-600 hover:bg-gray-200"
                          : "text-gray-400 hover:bg-gray-700"
                      }`}
                      title="Duplicar"
                    >
                      <FaClone size={18} />
                      <span>Duplicar</span>
                      <SL>{`D+${index + 1}`}</SL>
                    </button>
                  </PermissionGate>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
      {filteredWorkflows.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center">
          <FaSearch
            size={48}
            className={`mb-4 opacity-50 ${
              styleContext.state.buttonHoverColorWeight === "200"
                ? "text-gray-400"
                : "text-gray-500"
            }`}
          />
          <p
            className="text-xl font-medium mb-2"
            style={{ color: styleContext.state.textColor }}
          >
            Nenhum assunto encontrado
          </p>
          <p
            className={
              styleContext.state.buttonHoverColorWeight === "200"
                ? "text-sm text-gray-500"
                : "text-sm text-gray-400"
            }
          >
            Tente ajustar sua busca ou criar um novo assunto
          </p>
        </div>
      )}
    </div>
  );
};

const ViewButton = ({
  active,
  icon,
  onClick,
  title,
  shortcut,
  styleContext,
}: {
  active: boolean;
  icon: JSX.Element;
  onClick: () => void;
  title: string;
  shortcut: string;
  styleContext: any;
}) => {
  return (
    <div className="flex items-center space-x-2">
      <button
        title={title}
        onClick={onClick}
        className={`p-2 rounded transition-all duration-200 ${
          active
            ? styleContext.state.buttonHoverColorWeight === "200"
              ? "bg-white text-yellow-600 shadow-sm"
              : "bg-gray-700 text-yellow-400 shadow-sm"
            : styleContext.state.buttonHoverColorWeight === "200"
              ? "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
              : "text-gray-400 hover:text-gray-200 hover:bg-gray-700"
        }`}
      >
        {icon}
      </button>
      <SL>{shortcut}</SL>
    </div>
  );
};

const ViewButtons = ({
  isGridView,
  setView,
  styleContext,
}: {
  isGridView: boolean;
  setView: (listView: boolean) => void;
  styleContext: any;
}) => {
  return (
    <div className="flex items-center space-x-3.5">
      <div
        className={`flex items-center space-x-2 p-1.5 rounded-lg transition-colors duration-150 ${
          styleContext.state.buttonHoverColorWeight === "200"
            ? "bg-gray-100"
            : "bg-gray-800"
        }`}
      >
        <ViewButton
          active={isGridView}
          icon={<BsFillGridFill size={24} />}
          onClick={() => setView(false)}
          title="Visualização em grade"
          shortcut="G"
          styleContext={styleContext}
        />
        <ViewButton
          active={!isGridView}
          icon={<FaThList size={24} />}
          onClick={() => setView(true)}
          title="Visualização em lista"
          shortcut="T"
          styleContext={styleContext}
        />
      </div>
    </div>
  );
};
