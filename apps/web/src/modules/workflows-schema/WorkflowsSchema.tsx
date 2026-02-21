import { getAccessToken } from "../../auth/token";
import React, { useContext, useEffect, useState } from "react";
import { SL } from "../../components";
import { HotkeyContext } from "../../reducers/hotkeys.reducer";
import { StyleContext } from "../../reducers/style.reducer";
import { BsFillGridFill } from "react-icons/bs";
import {
  FaEdit,
  FaPlus,
  FaThList,
  FaCode,
  FaRocket,
  FaFlask,
  FaClone,
} from "react-icons/fa";
import { Loader2, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from "@open-urbis/map-ui";
import { ApiClient } from "../../api";
import { WorkflowSchema } from "../../api/types/workflows-schema.dto";
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
    <div className="flex flex-col space-y-6 mb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1
        className="text-2xl font-semibold mt-4 tracking-tight text-foreground"
      >
        Carta de Assuntos
      </h1>
      {showEdit && <StageSelectorButton stage={stage} setStage={setStage} />}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="flex justify-between items-center">
            <div className="flex-grow flex justify-between items-center space-x-4">
              <div className="flex-grow relative">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <Search
                      className="text-muted-foreground"
                      size={16}
                    />
                  </div>
                  <Input
                    type="text"
                    placeholder="Buscar assunto..."
                    value={search}
                    onChange={(e: any) => setSearch(e.target.value)}
                    className={`w-full h-10 pl-10 text-sm transition-all duration-200 ${
                      styleContext.state.buttonHoverColorWeight === "200"
                        ? "focus:ring-2 focus:ring-yellow-200 border-gray-200"
                        : "focus:ring-2 focus:ring-yellow-600 border-gray-700"
                    }`}
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
      <Dialog
        open={!!selectedDescription}
        onOpenChange={(open) => !open && setSelectedDescription(null)}
      >
        <DialogContent className="max-w-[640px] rounded-2xl border-muted/80 p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-3">
            <DialogTitle className="text-xl font-semibold tracking-tight text-foreground">
              {selectedDescription?.label}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Descrição completa do assunto selecionado.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[55vh] overflow-y-auto px-6 pb-2">
            <div
              className="max-w-none text-sm leading-6 text-foreground"
              dangerouslySetInnerHTML={{
                __html: selectedDescription?.text || "",
              }}
            />
          </div>
          <DialogFooter className="px-6 py-4 border-t bg-muted/20 gap-2 sm:gap-3">
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setSelectedDescription(null);
                if (selectedDescription) {
                  handleRequest(selectedDescription.id);
                }
              }}
              className="h-9 px-4 gap-2"
            >
              <span>Solicitar</span>
              <SL bg="yellow.700">Enter</SL>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-9 px-4 border-border bg-background hover:bg-muted text-foreground"
              onClick={() => setSelectedDescription(null)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center pt-10 space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="text-sm text-muted-foreground">Carregando assuntos...</span>
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
            <Button
              onClick={() => setStage("development")}
              variant={stage === "development" ? "secondary" : "ghost"}
              size="sm"
              className={`h-9 rounded-full px-4 gap-2 ${
                stage === "development"
                  ? "bg-card text-foreground border border-border hover:bg-muted/80"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
              }`}
            >
              <FaCode size={16} />
              <span>Desenvolvimento</span>
            </Button>
            <Button
              onClick={() => setStage("staging")}
              variant={stage === "staging" ? "secondary" : "ghost"}
              size="sm"
              className={`h-9 rounded-full px-4 gap-2 ${
                stage === "staging"
                  ? "bg-card text-foreground border border-border hover:bg-muted/80"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
              }`}
            >
              <FaFlask size={16} />
              <span>Homologação</span>
            </Button>
            <Button
              onClick={() => setStage("production")}
              variant={stage === "production" ? "secondary" : "ghost"}
              size="sm"
              className={`h-9 rounded-full px-4 gap-2 ${
                stage === "production"
                  ? "bg-card text-foreground border border-border hover:bg-muted/80"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
              }`}
            >
              <FaRocket size={16} />
              <span>Produção</span>
            </Button>
          </>
        ) : null}
      </div>
      <PermissionGate permission="workflow-schema:write:create">
        <Button
          onClick={() => navigate("/workflows-schema/new")}
          size="sm"
          className={`h-9 rounded-full px-4 gap-2 ${
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
        </Button>
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
        <Card
          key={workflow.id}
          className={`group rounded-2xl border transition-all duration-200 ${
            isGridView ? "hover:shadow-sm" : "hover:bg-opacity-50"
          } border-border bg-card text-card-foreground hover:border-yellow-500/70 hover:bg-muted/30`}
        >
          <CardContent className="p-5">
          <div
            className={`flex ${
              isGridView ? "flex-col h-full" : "space-x-5"
            } justify-between`}
          >
            <div className="flex-grow">
              <div className="flex items-center space-x-2 mb-3">
                <h3
                  className="text-lg font-semibold leading-tight text-foreground"
                >
                  {workflow.label}
                </h3>
              </div>
              <div className="relative">
                <div className="text-sm text-muted-foreground">
                  <div
                    className={`text-sm leading-relaxed ${workflow.description.length > 100 ? "line-clamp-3" : ""}`}
                    dangerouslySetInnerHTML={{
                      __html: workflow.description,
                    }}
                  />
                  {workflow.description.length > 100 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setSelectedDescription({
                          text: workflow.description,
                          label: workflow.label,
                          id: workflow.id,
                        })
                      }
                      className="h-auto px-0 py-0 text-xs mt-1 font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Ver mais
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <CardFooter
              className={`flex ${
                isGridView
                  ? "flex-col space-y-2 mt-auto pt-4"
                  : "items-center space-x-3"
              }`}
            >
              {(canCreateWorkflow || !isAuthenticated) && (
                <Button
                  onClick={() => handleRequest(workflow.id)}
                  size="sm"
                  className={`h-9 rounded-full px-5 gap-2 min-w-[150px] ${
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
                </Button>
              )}
              {showEdit && (
                <div
                  className={`flex ${
                    isGridView ? "flex-col space-y-2" : "space-x-2"
                  }`}
                >
                  <PermissionGate permission="workflow-schema:write:update">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handEditWorkflows(workflow.id)}
                      className={`h-8 px-3 rounded-md gap-2 ${
                        styleContext.state.buttonHoverColorWeight === "200"
                          ? "text-gray-600 hover:bg-gray-200"
                          : "text-gray-400 hover:bg-gray-700"
                      }`}
                      title="Editar"
                    >
                      <FaEdit size={18} />
                      <span>Editar</span>
                      <SL>{`E+${index + 1}`}</SL>
                    </Button>
                  </PermissionGate>
                  <PermissionGate permission="workflow-schema:write:copy">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicate(workflow.id)}
                      className={`h-8 px-3 rounded-md gap-2 ${
                        styleContext.state.buttonHoverColorWeight === "200"
                          ? "text-gray-600 hover:bg-gray-200"
                          : "text-gray-400 hover:bg-gray-700"
                      }`}
                      title="Duplicar"
                    >
                      <FaClone size={18} />
                      <span>Duplicar</span>
                      <SL>{`D+${index + 1}`}</SL>
                    </Button>
                  </PermissionGate>
                </div>
              )}
            </CardFooter>
          </div>
          </CardContent>
        </Card>
      ))}
      {filteredWorkflows.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center">
          <Search size={48} className="mb-4 text-muted-foreground/60" />
          <p className="text-xl font-medium mb-2 text-foreground">
            Nenhum assunto encontrado
          </p>
          <p className="text-sm text-muted-foreground">
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
      <Button
        type="button"
        variant="ghost"
        size="icon"
        title={title}
        onClick={onClick}
        className={`h-8 w-8 transition-all duration-200 ${
          active
            ? "bg-card text-yellow-500 border border-border shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
        }`}
      >
        {icon}
      </Button>
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
    <div className="flex items-center space-x-2">
      <div
        className="flex items-center space-x-1 p-1 rounded-lg border border-border bg-muted/60 transition-colors duration-150"
      >
        <ViewButton
          active={isGridView}
          icon={<BsFillGridFill size={18} />}
          onClick={() => setView(false)}
          title="Visualização em grade"
          shortcut="G"
          styleContext={styleContext}
        />
        <ViewButton
          active={!isGridView}
          icon={<FaThList size={18} />}
          onClick={() => setView(true)}
          title="Visualização em lista"
          shortcut="T"
          styleContext={styleContext}
        />
      </div>
    </div>
  );
};
