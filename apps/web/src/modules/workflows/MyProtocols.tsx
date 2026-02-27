import { getAccessToken } from "../../auth/token";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Badge,
  Button,
  Calendar,
  Card,
  CardContent,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SL } from "../../components";
import { ApiClient } from "../../api";
import {
  WorkflowMetadata,
  FindAllWorkflowsParams,
} from "../../api/types/workflows.dto";
import { useSnackbar } from "../../hooks/snackbar";
import {
  FaInbox,
  FaChevronLeft,
  FaChevronRight,
  FaCode,
  FaFlask,
  FaRocket,
  FaLink,
  FaSearch,
  FaSortUp,
  FaSortDown,
  FaSort,
  FaTimes,
  FaFilter,
  FaCalendarAlt,
  FaEye,
} from "react-icons/fa";
import { Spinner } from "../../components";
import { formatId } from "./activities/common";
import { usePermissions } from "../../reducers/permission.context";
import { SearchPreviewDialog } from "./components/SearchPreviewDialog";

const api = new ApiClient({
  baseURL: import.meta.env.VITE_BACK_END_API || "",
  headers: {
    Authorization: `Bearer ${getAccessToken()}`,
  },
});

function EmptyState({ hasFilters }: { hasFilters?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-400px)] min-h-[200px]">
      <FaInbox size={34} className="text-muted-foreground" />
      <p className="text-lg font-medium mt-3 mb-1.5 text-foreground">
        Nenhum protocolo encontrado
      </p>
      <p className="text-sm text-muted-foreground">
        {hasFilters
          ? "Tente ajustar seus filtros de busca."
          : "Você ainda não possui nenhum protocolo registrado."}
      </p>
      {!hasFilters && (
        <p className="text-xs mt-1.5 text-muted-foreground">
          Acesse a Carta de Assuntos para iniciar um novo protocolo.
        </p>
      )}
    </div>
  );
}

type SortField = "timestamp" | "updatedAt" | "label" | "relevance";
type SortOrder = "ASC" | "DESC";

function SortIcon({
  field,
  currentSort,
  currentOrder,
}: {
  field: SortField;
  currentSort: SortField;
  currentOrder: SortOrder;
}) {
  if (currentSort !== field) {
    return <FaSort size={11} className="text-muted-foreground/50" />;
  }
  return currentOrder === "ASC" ? (
    <FaSortUp size={11} className="text-foreground" />
  ) : (
    <FaSortDown size={11} className="text-foreground" />
  );
}

export function AllWorkflows(): JSX.Element {
  return <MyProtocols mode="admin" />;
}

export function MyProtocols({ mode = "mine" }: { mode?: "mine" | "admin" }): JSX.Element {
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
  const [previewWorkflowId, setPreviewWorkflowId] = useState<string | null>(null);
  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const pageSize = 10;

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterLabel, setFilterLabel] = useState("");
  const [filterCreatedByName, setFilterCreatedByName] = useState("");
  const [filterWorkflowId, setFilterWorkflowId] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState<Date | undefined>(undefined);
  const [filterDateTo, setFilterDateTo] = useState<Date | undefined>(undefined);

  // Sort state
  const [sortBy, setSortBy] = useState<SortField>("timestamp");
  const [sortOrder, setSortOrder] = useState<SortOrder>("DESC");

  // Debounce timer for search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  const [filterStatus, setFilterStatus] = useState("");

  const hasActiveFilters =
    searchQuery ||
    filterLabel ||
    filterCreatedByName ||
    filterWorkflowId ||
    filterStatus ||
    filterDateFrom !== undefined ||
    filterDateTo !== undefined;

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

  const handleProtocols = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params: FindAllWorkflowsParams = {
          stage,
          page,
          pageSize,
          sortBy,
          sortOrder,
        };

        if (searchQuery) params.query = searchQuery;
        if (filterLabel) params.label = filterLabel;
        if (filterCreatedByName) params.createdByName = filterCreatedByName;
        if (filterWorkflowId) params.workflowId = filterWorkflowId;
        if (filterStatus) params.status = filterStatus;
        if (filterDateFrom) params.dateFrom = filterDateFrom.toISOString();
        if (filterDateTo) {
          const endDate = new Date(filterDateTo);
          endDate.setHours(23, 59, 59, 999);
          params.dateTo = endDate.toISOString();
        }

        const response = mode === "admin"
          ? await api.workflows.findAllAdmin(params)
          : await api.workflows.findAll(params);
        setData(response.workflows);
        setTotalPages(Math.ceil(response.pagination.total / pageSize));
      } catch (error) {
        console.error(error);
        snackbar.error("Erro ao carregar protocolos");
      }
      setLoading(false);
    },
    [
      stage,
      pageSize,
      sortBy,
      sortOrder,
      searchQuery,
      filterLabel,
      filterCreatedByName,
      filterWorkflowId,
      filterStatus,
      filterDateFrom,
      filterDateTo,
      mode,
    ]
  );

  useEffect(() => {
    handleProtocols(currentPage);
  }, [currentPage, handleProtocols]);

  // Reset to page 1 when filters/sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    stage,
    searchQuery,
    filterLabel,
    filterCreatedByName,
    filterWorkflowId,
    filterStatus,
    filterDateFrom,
    filterDateTo,
    sortBy,
    sortOrder,
  ]);

  const handleSearchChange = (value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchQuery(value);
    }, 400);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilterLabel("");
    setFilterCreatedByName("");
    setFilterWorkflowId("");
    setFilterStatus("");
    setFilterDateFrom(undefined);
    setFilterDateTo(undefined);
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "ASC" ? "DESC" : "ASC"));
    } else {
      setSortBy(field);
      setSortOrder(field === "label" ? "ASC" : "DESC");
    }
  };

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
        {mode === "admin" ? "Todos os Pedidos" : "Meus Pedidos"}
      </h1>

      {loading && !data.length ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="xl" />
        </div>
      ) : (
        <>
          <div className="flex flex-col space-y-5">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                {canEditWorkflowSchema ? (
                  <>
                    <Button
                      variant={stage === "development" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setStage("development")}
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
                      variant={stage === "staging" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setStage("staging")}
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
                      variant={stage === "production" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setStage("production")}
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
            </div>

            {/* Search bar + filter toggle */}
            <div className="flex items-center space-x-2">
              <div className="flex-grow relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <FaSearch className="text-muted-foreground" size={14} />
                </div>
                <Input
                  type="text"
                  placeholder="Buscar protocolos..."
                  defaultValue={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleSearchChange(e.target.value)
                  }
                  className="w-full h-10 pl-9 text-sm transition-all duration-200 focus:ring-2 focus:ring-primary"
                />
              </div>
              <Button
                type="button"
                variant={showFilters ? "secondary" : "outline"}
                size="sm"
                onClick={() => setShowFilters((v) => !v)}
                className={`h-10 px-3 gap-2 shrink-0 ${
                  showFilters
                    ? "bg-card text-foreground border border-border"
                    : ""
                } ${hasActiveFilters ? "border-primary text-primary" : ""}`}
              >
                <FaFilter size={12} />
                <span className="hidden sm:inline">Filtros</span>
                {hasActiveFilters && (
                  <span className="w-2 h-2 rounded-full bg-primary" />
                )}
              </Button>
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-10 px-3 gap-1.5 text-muted-foreground hover:text-foreground shrink-0"
                >
                  <FaTimes size={12} />
                  <span className="hidden sm:inline">Limpar</span>
                </Button>
              )}
            </div>

            {/* Expandable column filters */}
            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-4 rounded-xl border border-border bg-muted/20">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Protocolo (ID)
                  </label>
                  <Input
                    type="text"
                    placeholder="Ex: a1b2c3d4"
                    value={filterWorkflowId}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFilterWorkflowId(e.target.value)
                    }
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Assunto
                  </label>
                  <Input
                    type="text"
                    placeholder="Filtrar por assunto"
                    value={filterLabel}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFilterLabel(e.target.value)
                    }
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Criado por
                  </label>
                  <Input
                    type="text"
                    placeholder="Nome do autor"
                    value={filterCreatedByName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFilterCreatedByName(e.target.value)
                    }
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Status
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">Todos</option>
                    <option value="Em andamento">Em andamento</option>
                    <option value="Completo">Completo</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Período
                  </label>
                  <div className="flex items-center space-x-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={`h-9 text-sm flex-1 justify-start font-normal ${
                            !filterDateFrom ? "text-muted-foreground" : ""
                          }`}
                        >
                          <FaCalendarAlt size={12} className="mr-2" />
                          {filterDateFrom
                            ? format(filterDateFrom, "dd/MM/yyyy", { locale: ptBR })
                            : "De"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filterDateFrom}
                          onSelect={setFilterDateFrom}
                          locale={ptBR}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <span className="text-xs text-muted-foreground">até</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={`h-9 text-sm flex-1 justify-start font-normal ${
                            !filterDateTo ? "text-muted-foreground" : ""
                          }`}
                        >
                          <FaCalendarAlt size={12} className="mr-2" />
                          {filterDateTo
                            ? format(filterDateTo, "dd/MM/yyyy", { locale: ptBR })
                            : "Até"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filterDateTo}
                          onSelect={setFilterDateTo}
                          locale={ptBR}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Card className="overflow-hidden rounded-2xl border border-border bg-card text-card-foreground">
            {data.length === 0 ? (
              <EmptyState hasFilters={!!hasActiveFilters} />
            ) : (
              <CardContent className="p-0">
                {loading && (
                  <div className="absolute inset-0 z-10 bg-card/60 flex items-center justify-center">
                    <Spinner size="lg" />
                  </div>
                )}
                <div className="overflow-x-auto relative">
                  <TooltipProvider>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="bg-muted/40">
                            Protocolo
                          </TableHead>
                          <TableHead
                            className="bg-muted/40 cursor-pointer select-none"
                            onClick={() => handleSort("label")}
                          >
                            <div className="flex items-center gap-1.5">
                              Assunto
                              <SortIcon
                                field="label"
                                currentSort={sortBy}
                                currentOrder={sortOrder}
                              />
                            </div>
                          </TableHead>
                          <TableHead className="bg-muted/40">
                            Descrição
                          </TableHead>
                          <TableHead className="bg-muted/40">
                            Criado por
                          </TableHead>
                          <TableHead className="bg-muted/40">
                            Status
                          </TableHead>
                          <TableHead
                            className="bg-muted/40 cursor-pointer select-none"
                            onClick={() => handleSort("timestamp")}
                          >
                            <div className="flex items-center gap-1.5">
                              Criado
                              <SortIcon
                                field="timestamp"
                                currentSort={sortBy}
                                currentOrder={sortOrder}
                              />
                            </div>
                          </TableHead>
                          <TableHead
                            className="bg-muted/40 cursor-pointer select-none"
                            onClick={() => handleSort("updatedAt")}
                          >
                            <div className="flex items-center gap-1.5">
                              Atualizado
                              <SortIcon
                                field="updatedAt"
                                currentSort={sortBy}
                                currentOrder={sortOrder}
                              />
                            </div>
                          </TableHead>
                          {searchQuery && (
                            <TableHead className="bg-muted/40 w-10">
                              <span className="sr-only">Prévia</span>
                            </TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                      {data.map((item) => (
                        <TableRow
                          key={item.id}
                          onClick={() => navigate(`/workflows/${item.id}${searchQuery ? `?highlight=${encodeURIComponent(searchQuery)}` : ""}`)}
                          className="cursor-pointer transition-colors hover:bg-muted/40"
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
                          <TableCell>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="line-clamp-1 text-muted-foreground">
                                  {item.description || "—"}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>{item.description}</TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {item.createdBy?.name || "—"}
                          </TableCell>
                          <TableCell>
                            {item.status === "Completo" ? (
                              <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 hover:bg-green-100">
                                Completo
                              </Badge>
                            ) : (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="secondary" className="cursor-default">
                                    {item.status || "Em andamento"}
                                  </Badge>
                                </TooltipTrigger>
                                {item.currentStep && (
                                  <TooltipContent>Etapa atual: {item.currentStep}</TooltipContent>
                                )}
                              </Tooltip>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(String(item.createdAt))}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(String(item.updatedAt))}
                          </TableCell>
                          {searchQuery && (
                            <TableCell>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPreviewWorkflowId(item.id);
                                    }}
                                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                                  >
                                    <FaEye size={13} />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Pré-visualizar correspondências</TooltipContent>
                              </Tooltip>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                      </TableBody>
                    </Table>
                  </TooltipProvider>
                </div>

                <div className="px-4 py-3 flex items-center justify-between border-t border-border bg-muted/10">
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
                        <SL bg="primary">
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
                        <SL bg="primary">
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

      <SearchPreviewDialog
        workflowId={previewWorkflowId}
        query={searchQuery}
        onClose={() => setPreviewWorkflowId(null)}
      />
    </div>
  );
}
