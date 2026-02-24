import { getAccessToken } from "../../auth/token";
import React, { useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@open-urbis/map-ui";
import { useNavigate } from "react-router-dom";
import { SL } from "../../components";
import { ApiClient } from "../../api";
import { WorkflowMetadata } from "../../api/types/workflows.dto";
import { useSnackbar } from "../../hooks/snackbar";
import { Loader2 } from "lucide-react";
import {
  FaInbox,
  FaChevronLeft,
  FaChevronRight,
  FaCode,
  FaFlask,
  FaRocket,
  FaLink,
} from "react-icons/fa";
import { formatId } from "./activities/common";
import { usePermissions } from "../../reducers/permission.context";

const api = new ApiClient({
  baseURL: import.meta.env.VITE_BACK_END_API || "",
  headers: {
    Authorization: `Bearer ${getAccessToken()}`,
  },
});

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-300px)]">
      <FaInbox size={34} className="text-muted-foreground" />
      <p className="text-lg font-medium mt-3 mb-1.5 text-foreground">
        Nenhum protocolo encontrado
      </p>
      <p className="text-sm text-muted-foreground">
        Você ainda não possui nenhum protocolo registrado.
      </p>
      <p className="text-xs mt-1.5 text-muted-foreground">
        Acesse a Carta de Assuntos para iniciar um novo protocolo.
      </p>
    </div>
  );
}

export function MyProtocols(): JSX.Element {
  const [data, setData] = useState<WorkflowMetadata[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const { hasPermission } = usePermissions();
  const canEditWorkflowSchema = hasPermission("workflow-schema:write:update");
  const [stage, setStage] = useState(
    canEditWorkflowSchema ? "development" : "production"
  );
  const [tooltipItem, setTooltipItem] = useState<string | null>(null);
  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const pageSize = 10;

  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  const nextPage = () => {
    if (!isLastPage) {
      setCurrentPage((page) => page + 1);
    }
  };

  const prevPage = () => {
    if (!isFirstPage) {
      setCurrentPage((page) => page - 1);
    }
  };

  const handleProtocols = async (page = 1) => {
    setLoading(true);
    try {
      const response = await api.workflows.findAll(stage, page, pageSize);
      setData(response.workflows);
      setTotalPages(Math.ceil(response.pagination.total / pageSize));
    } catch (error) {
      console.error(error);
      snackbar.error("Erro ao carregar protocolos");
    }
    setLoading(false);
  };

  useEffect(() => {
    handleProtocols(currentPage);
    
  }, [currentPage, stage]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  return (
    <div className="flex flex-col space-y-8 mb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold mt-4 tracking-tight text-foreground">
        Meus Pedidos
      </h1>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              {canEditWorkflowSchema ? (
                <>
                  <Button
                    variant={stage === "development" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setStage("development")}
                    className="h-9 rounded-full px-4 gap-2"
                  >
                    <FaCode size={16} />
                    <span>Desenvolvimento</span>
                  </Button>
                  <Button
                    variant={stage === "staging" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setStage("staging")}
                    className="h-9 rounded-full px-4 gap-2"
                  >
                    <FaFlask size={16} />
                    <span>Homologação</span>
                  </Button>
                  <Button
                    variant={stage === "production" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setStage("production")}
                    className="h-9 rounded-full px-4 gap-2"
                  >
                    <FaRocket size={16} />
                    <span>Produção</span>
                  </Button>
                </>
              ) : null}
            </div>
          </div>

          <Card className="overflow-hidden border border-border">
            {data.length === 0 ? (
              <EmptyState />
            ) : (
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <TooltipProvider>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="bg-muted/40">Protocolo</TableHead>
                          <TableHead className="bg-muted/40">Assunto</TableHead>
                          <TableHead className="bg-muted/40">Criado</TableHead>
                          <TableHead className="bg-muted/40">Atualizado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                      {data.map((item) => (
                        <TableRow
                          key={item.id}
                          onClick={() => navigate(`/workflows/${item.id}`)}
                          className="cursor-pointer"
                        >
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Badge variant="secondary" className="font-medium">
                                {formatId(item.id)}
                              </Badge>
                              <Tooltip open={tooltipItem === item.id}>
                                <TooltipTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(item.id);
                                    setTooltipItem(item.id);
                                    setTimeout(
                                      () => setTooltipItem(null),
                                      1500
                                    );
                                  }}
                                    className="h-7 w-7"
                                >
                                  <FaLink size={12} />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Copiado!</TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="line-clamp-1 text-foreground">
                                {item.label}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>{item.label}</TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(String(item.createdAt))}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(String(item.updatedAt))}
                          </TableCell>
                        </TableRow>
                      ))}
                      </TableBody>
                    </Table>
                  </TooltipProvider>
                </div>

                <div className="px-4 py-3 flex items-center justify-between border-t">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={prevPage}
                      disabled={isFirstPage}
                      className="h-8 px-3 text-xs"
                    >
                      Anterior
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={nextPage}
                      disabled={isLastPage}
                      className="ml-2 h-8 px-3 text-xs"
                    >
                      Próximo
                    </Button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Página{" "}
                        <span className="font-medium">{currentPage}</span> de{" "}
                        <span className="font-medium">{totalPages}</span>
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={prevPage}
                        disabled={isFirstPage}
                        className="h-8 gap-1.5 px-3 text-xs"
                      >
                        <FaChevronLeft />
                        Anterior
                        <SL bg="yellow.700">
                          ←
                        </SL>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={nextPage}
                        disabled={isLastPage}
                        className="h-8 gap-1.5 px-3 text-xs"
                      >
                        Próximo
                        <FaChevronRight />
                        <SL bg="yellow.700">
                          →
                        </SL>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
