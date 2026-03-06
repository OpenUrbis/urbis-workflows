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
import { useNavigate, useSearchParams } from "react-router-dom";
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
  FaFileCsv,
  FaFilePdf,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { Spinner } from "../../components";
import { formatId } from "./activities/common";
import { usePermissions } from "../../reducers/permission.context";
import { SearchPreviewDialog } from "./components/SearchPreviewDialog";
import {
  downloadBlob,
  exportRowsToCsv,
  printHtmlViaIframe,
} from "./utils/workflows-export";
import {
  formatDateTimePtBr,
  formatDateTimePtBrSafe,
} from "./utils/workflows-date";
import { GeoFilterMap, GeoBounds } from "./components/GeoFilterMap";
import { StructuredQueryInput } from "./components/StructuredQueryInput";

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

type SortField = "timestamp" | "updatedAt" | "label" | "relevance" | "createdByName" | "workflowId";
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

export function WorkflowsReportPage(): JSX.Element {
  return <WorkflowsListPage mode="admin" />;
}

export function MyWorkflowsPage(): JSX.Element {
  return <WorkflowsListPage mode="mine" />;
}

export function WorkflowsListPage({ mode = "mine" }: { mode?: "mine" | "admin" }): JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<WorkflowMetadata[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(() => {
    const p = parseInt(searchParams.get("page") || "1", 10);
    return Number.isNaN(p) || p < 1 ? 1 : p;
  });
  const [loading, setLoading] = useState(true);
  const { hasPermission } = usePermissions();
  const canEditWorkflowSchema = hasPermission("workflow-schema:write:update");
  const [stage, setStage] = useState(
    searchParams.get("stage") || (canEditWorkflowSchema ? "development" : "production")
  );
  const [tooltipItem, setTooltipItem] = useState<string | null>(null);
  const [previewWorkflowId, setPreviewWorkflowId] = useState<string | null>(null);
  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const pageSize = 10;

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState(searchParams.get("query") || "");
  const [showFilters, setShowFilters] = useState(
    !!searchParams.get("status") ||
      !!searchParams.get("label") ||
      !!searchParams.get("createdByName") ||
      !!searchParams.get("workflowId") ||
      !!searchParams.get("dateFrom") ||
      !!searchParams.get("dateTo") ||
      !!searchParams.get("geoBoundsSwLat") ||
      !!searchParams.get("structuredQuery")
  );
  const [filterLabel, setFilterLabel] = useState(searchParams.get("label") || "");
  const [filterCreatedByName, setFilterCreatedByName] = useState(searchParams.get("createdByName") || "");
  const [filterWorkflowId, setFilterWorkflowId] = useState(searchParams.get("workflowId") || "");
  const [filterDateFrom, setFilterDateFrom] = useState<Date | undefined>(() => {
    const v = searchParams.get("dateFrom");
    if (!v) return undefined;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? undefined : d;
  });
  const [filterDateTo, setFilterDateTo] = useState<Date | undefined>(() => {
    const v = searchParams.get("dateTo");
    if (!v) return undefined;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? undefined : d;
  });

  // Geo filter state
  const [geoBounds, setGeoBounds] = useState<GeoBounds | undefined>(() => {
    const sw = searchParams.get("geoBoundsSwLat");
    const swLng = searchParams.get("geoBoundsSwLng");
    const ne = searchParams.get("geoBoundsNeLat");
    const neLng = searchParams.get("geoBoundsNeLng");
    if (sw && swLng && ne && neLng) {
      return {
        swLat: parseFloat(sw),
        swLng: parseFloat(swLng),
        neLat: parseFloat(ne),
        neLng: parseFloat(neLng),
      };
    }
    return undefined;
  });
  const [showGeoMap, setShowGeoMap] = useState(false);

  // Structured query state
  const [filterStructuredQuery, setFilterStructuredQuery] = useState(searchParams.get("structuredQuery") || "");

  // Sort state
  const [sortBy, setSortBy] = useState<SortField>((searchParams.get("sortBy") as SortField) || "timestamp");
  const [sortOrder, setSortOrder] = useState<SortOrder>((searchParams.get("sortOrder") as SortOrder) || "DESC");

  // Debounce timer for search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  const [filterStatus, setFilterStatus] = useState(searchParams.get("status") || "");

  const [debouncedFilterLabel, setDebouncedFilterLabel] = useState(filterLabel);
  const [debouncedFilterCreatedByName, setDebouncedFilterCreatedByName] = useState(filterCreatedByName);
  const [debouncedFilterWorkflowId, setDebouncedFilterWorkflowId] = useState(filterWorkflowId);
  const [debouncedFilterStatus, setDebouncedFilterStatus] = useState(filterStatus);
  const [debouncedStructuredQuery, setDebouncedStructuredQuery] = useState(filterStructuredQuery);

  const hasActiveFilters =
    searchQuery ||
    filterLabel ||
    filterCreatedByName ||
    filterWorkflowId ||
    filterStatus ||
    filterDateFrom !== undefined ||
    filterDateTo !== undefined ||
    geoBounds !== undefined ||
    filterStructuredQuery;

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
        if (debouncedFilterLabel) params.label = debouncedFilterLabel;
        if (debouncedFilterCreatedByName) params.createdByName = debouncedFilterCreatedByName;
        if (debouncedFilterWorkflowId) params.workflowId = debouncedFilterWorkflowId;
        if (debouncedFilterStatus) params.status = debouncedFilterStatus;
        if (filterDateFrom) params.dateFrom = filterDateFrom.toISOString();
        if (filterDateTo) {
          const endDate = new Date(filterDateTo);
          endDate.setHours(23, 59, 59, 999);
          params.dateTo = endDate.toISOString();
        }
        if (geoBounds) {
          params.geoBoundsSwLat = geoBounds.swLat;
          params.geoBoundsSwLng = geoBounds.swLng;
          params.geoBoundsNeLat = geoBounds.neLat;
          params.geoBoundsNeLng = geoBounds.neLng;
        }
        if (debouncedStructuredQuery) params.structuredQuery = debouncedStructuredQuery;

        const response = mode === "admin"
          ? await api.workflows.findAllAdmin(params)
          : await api.workflows.findAll(params);
        setData(response.workflows);
        setTotalItems(response.pagination.total);
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
      debouncedFilterLabel,
      debouncedFilterCreatedByName,
      debouncedFilterWorkflowId,
      debouncedFilterStatus,
      filterDateFrom,
      filterDateTo,
      geoBounds,
      debouncedStructuredQuery,
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
    debouncedFilterLabel,
    debouncedFilterCreatedByName,
    debouncedFilterWorkflowId,
    debouncedFilterStatus,
    filterDateFrom,
    filterDateTo,
    geoBounds,
    debouncedStructuredQuery,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedFilterLabel(filterLabel);
      setDebouncedFilterCreatedByName(filterCreatedByName);
      setDebouncedFilterWorkflowId(filterWorkflowId);
      setDebouncedFilterStatus(filterStatus);
    }, 400);
    return () => clearTimeout(t);
  }, [filterLabel, filterCreatedByName, filterWorkflowId, filterStatus]);

  useEffect(() => {
    if (mode !== "admin") {
      const next = new URLSearchParams(searchParams);
      if (stage) next.set("stage", stage);
      else next.delete("stage");
      if (next.toString() !== searchParams.toString()) {
        setSearchParams(next, { replace: true });
      }
      return;
    }

    const params = new URLSearchParams();
    if (stage) params.set("stage", stage);
    if (currentPage && currentPage !== 1) params.set("page", String(currentPage));
    if (searchQuery) params.set("query", searchQuery);
    if (filterLabel) params.set("label", filterLabel);
    if (filterCreatedByName) params.set("createdByName", filterCreatedByName);
    if (filterWorkflowId) params.set("workflowId", filterWorkflowId);
    if (filterStatus) params.set("status", filterStatus);
    if (filterDateFrom) params.set("dateFrom", filterDateFrom.toISOString());
    if (filterDateTo) {
      const endDate = new Date(filterDateTo);
      endDate.setHours(23, 59, 59, 999);
      params.set("dateTo", endDate.toISOString());
    }
    if (geoBounds) {
      params.set("geoBoundsSwLat", String(geoBounds.swLat));
      params.set("geoBoundsSwLng", String(geoBounds.swLng));
      params.set("geoBoundsNeLat", String(geoBounds.neLat));
      params.set("geoBoundsNeLng", String(geoBounds.neLng));
    }
    if (filterStructuredQuery) params.set("structuredQuery", filterStructuredQuery);
    if (sortBy) params.set("sortBy", sortBy);
    if (sortOrder) params.set("sortOrder", sortOrder);

    setSearchParams(params, { replace: true });
  }, [
    mode,
    stage,
    currentPage,
    searchQuery,
    filterLabel,
    filterCreatedByName,
    filterWorkflowId,
    filterStatus,
    filterDateFrom,
    filterDateTo,
    geoBounds,
    filterStructuredQuery,
    sortBy,
    sortOrder,
    setSearchParams,
    searchParams,
  ]);

  const handleSearchChange = (value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchQuery(value);
    }, 400);
  };

  const applyStructuredQuery = () => {
    setDebouncedStructuredQuery(filterStructuredQuery);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilterLabel("");
    setFilterCreatedByName("");
    setFilterWorkflowId("");
    setFilterStatus("");
    setFilterDateFrom(undefined);
    setFilterDateTo(undefined);
    setGeoBounds(undefined);
    setShowGeoMap(false);
    setFilterStructuredQuery("");
    setDebouncedStructuredQuery("");
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "ASC" ? "DESC" : "ASC"));
    } else {
      setSortBy(field);
      setSortOrder(field === "label" || field === "createdByName" || field === "workflowId" ? "ASC" : "DESC");
    }
  };

  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);

  const buildExportParams = useCallback((): FindAllWorkflowsParams => {
    const params: FindAllWorkflowsParams = { stage, sortBy, sortOrder };
    if (searchQuery) params.query = searchQuery;
    if (debouncedFilterLabel) params.label = debouncedFilterLabel;
    if (debouncedFilterCreatedByName) params.createdByName = debouncedFilterCreatedByName;
    if (debouncedFilterWorkflowId) params.workflowId = debouncedFilterWorkflowId;
    if (debouncedFilterStatus) params.status = debouncedFilterStatus;
    if (filterDateFrom) params.dateFrom = filterDateFrom.toISOString();
    if (filterDateTo) {
      const endDate = new Date(filterDateTo);
      endDate.setHours(23, 59, 59, 999);
      params.dateTo = endDate.toISOString();
    }
    if (geoBounds) {
      params.geoBoundsSwLat = geoBounds.swLat;
      params.geoBoundsSwLng = geoBounds.swLng;
      params.geoBoundsNeLat = geoBounds.neLat;
      params.geoBoundsNeLng = geoBounds.neLng;
    }
    if (debouncedStructuredQuery) params.structuredQuery = debouncedStructuredQuery;
    return params;
  }, [stage, sortBy, sortOrder, searchQuery, debouncedFilterLabel, debouncedFilterCreatedByName, debouncedFilterWorkflowId, debouncedFilterStatus, filterDateFrom, filterDateTo, geoBounds, debouncedStructuredQuery]);

  const fetchAllItems = useCallback(async (): Promise<WorkflowMetadata[]> => {
    const batchSize = 100;
    const baseParams = buildExportParams();
    const firstResponse = mode === "admin"
      ? await api.workflows.findAllAdmin({ ...baseParams, page: 1, pageSize: batchSize })
      : await api.workflows.findAll({ ...baseParams, page: 1, pageSize: batchSize });

    const all = [...firstResponse.workflows];
    const pages = Math.ceil(firstResponse.pagination.total / batchSize);

    for (let p = 2; p <= pages; p++) {
      const res = mode === "admin"
        ? await api.workflows.findAllAdmin({ ...baseParams, page: p, pageSize: batchSize })
        : await api.workflows.findAll({ ...baseParams, page: p, pageSize: batchSize });
      all.push(...res.workflows);
    }
    return all;
  }, [buildExportParams, mode]);

  const formatDateExport = (dateStr: string) => formatDateTimePtBrSafe(dateStr);

  const exportCsv = useCallback(async () => {
    setExporting("csv");
    try {
      const items = await fetchAllItems();
      const rows = items.map((item) => ({
        Protocolo: item.id,
        Assunto: item.label,
        "Criado por": item.createdBy?.name || "",
        Status: item.status || "Em andamento",
        Criado: formatDateExport(String(item.createdAt)),
        Atualizado: formatDateExport(String(item.updatedAt)),
      }));
      const csv = exportRowsToCsv(rows);
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      downloadBlob(blob, `relatorio-${new Date().toISOString().slice(0, 10)}.csv`);
    } catch (err) {
      console.error(err);
      snackbar.error("Erro ao exportar CSV");
    }
    setExporting(null);
  }, [fetchAllItems, snackbar]);

  const exportPdf = useCallback(async () => {
    setExporting("pdf");
    try {
      const items = await fetchAllItems();
      const tableRows = items
        .map(
          (item) =>
            `<tr>
              <td>${item.id.slice(0, 8)}</td>
              <td>${item.label}</td>
              <td>${item.createdBy?.name || ""}</td>
              <td>${item.status || "Em andamento"}</td>
              <td>${formatDateExport(String(item.createdAt))}</td>
              <td>${formatDateExport(String(item.updatedAt))}</td>
            </tr>`,
        )
        .join("");
      const html = `<!DOCTYPE html>
        <html><head><title>Relatório</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 11px; margin: 20px; }
          h1 { font-size: 16px; margin-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
          th { background: #f5f5f5; font-weight: 600; }
          tr:nth-child(even) { background: #fafafa; }
          @media print { body { margin: 10mm; } }
        </style></head><body>
        <h1>Relatório — ${items.length} itens</h1>
        <table>
          <thead><tr>
            <th>Protocolo</th><th>Assunto</th><th>Criado por</th><th>Status</th><th>Criado</th><th>Atualizado</th>
          </tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
        </body></html>`;

      await printHtmlViaIframe(html, 400);
    } catch (err) {
      console.error(err);
      snackbar.error("Erro ao exportar PDF");
    }
    setExporting(null);
  }, [fetchAllItems, snackbar]);

  const formatDate = (dateStr: string) => formatDateTimePtBr(dateStr);

  return (
    <div className="flex flex-col space-y-8 mb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold mt-4 tracking-tight text-foreground">
        {mode === "admin" ? "Relatório" : "Meus Pedidos"}
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
              {mode === "admin" && (
                <>
                  <div className="border-l border-border h-6 mx-1" />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={exportCsv}
                    disabled={!!exporting || totalItems === 0}
                    className="h-10 px-3 gap-1.5 shrink-0"
                  >
                    {exporting === "csv" ? <Spinner size="sm" /> : <FaFileCsv size={14} />}
                    <span className="hidden sm:inline">CSV</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={exportPdf}
                    disabled={!!exporting || totalItems === 0}
                    className="h-10 px-3 gap-1.5 shrink-0"
                  >
                    {exporting === "pdf" ? <Spinner size="sm" /> : <FaFilePdf size={14} />}
                    <span className="hidden sm:inline">PDF</span>
                  </Button>
                </>
              )}
            </div>

            {/* Expandable column filters */}
            {showFilters && (
              <>
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
                  <Input
                    type="text"
                    placeholder="Filtrar por status"
                    value={filterStatus}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFilterStatus(e.target.value)
                    }
                    className="h-9 text-sm"
                  />
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

                {/* Structured field query */}
                <div className="sm:col-span-2 lg:col-span-5 space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Consulta por campos
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <StructuredQueryInput
                        value={filterStructuredQuery}
                        onChange={setFilterStructuredQuery}
                        onApply={applyStructuredQuery}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={applyStructuredQuery}
                      disabled={!filterStructuredQuery || filterStructuredQuery === debouncedStructuredQuery}
                      className="h-9 px-4 gap-1.5 shrink-0"
                    >
                      <FaSearch size={11} />
                      Buscar
                    </Button>
                  </div>
                </div>

                {/* Geo filter toggle */}
                <div className="sm:col-span-2 lg:col-span-5 flex items-center gap-2 pt-1">
                  <Button
                    type="button"
                    variant={geoBounds ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setShowGeoMap((v) => !v)}
                    className={`h-9 px-4 gap-2 text-xs ${
                      geoBounds ? "border-primary text-primary" : ""
                    }`}
                  >
                    <FaMapMarkerAlt size={12} />
                    {geoBounds ? "Filtro geoespacial ativo" : "Filtro geoespacial"}
                    {geoBounds && <span className="w-2 h-2 rounded-full bg-primary" />}
                  </Button>
                  {geoBounds && !showGeoMap && (
                    <span className="text-xs text-muted-foreground font-mono">
                      [{geoBounds.swLat.toFixed(3)}, {geoBounds.swLng.toFixed(3)}] → [{geoBounds.neLat.toFixed(3)}, {geoBounds.neLng.toFixed(3)}]
                    </span>
                  )}
                </div>
              </div>

              {/* Geo filter map */}
              {showGeoMap && (
                <div className="p-4 rounded-xl border border-border bg-muted/20">
                  <GeoFilterMap
                    value={geoBounds}
                    onChange={(bounds) => {
                      setGeoBounds(bounds);
                    }}
                    onClose={() => setShowGeoMap(false)}
                  />
                </div>
              )}
              </>
            )}
          </div>

          <Card className="overflow-hidden rounded-2xl border border-border bg-card text-card-foreground">
            {data.length === 0 ? (
              <EmptyState hasFilters={!!hasActiveFilters} />
            ) : (
              <CardContent className="p-0">
                {loading && (
                  <div className="fixed inset-0 z-50 bg-card/60 flex items-center justify-center">
                    <Spinner size="lg" />
                  </div>
                )}
                <div className="overflow-x-auto relative">
                  <TooltipProvider>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead
                            className="bg-muted/40 cursor-pointer select-none"
                            onClick={() => handleSort("workflowId")}
                          >
                            <div className="flex items-center gap-1.5">
                              Protocolo
                              <SortIcon
                                field="workflowId"
                                currentSort={sortBy}
                                currentOrder={sortOrder}
                              />
                            </div>
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
                          <TableHead
                            className="bg-muted/40 cursor-pointer select-none"
                            onClick={() => handleSort("createdByName")}
                          >
                            <div className="flex items-center gap-1.5">
                              Criado por
                              <SortIcon
                                field="createdByName"
                                currentSort={sortBy}
                                currentOrder={sortOrder}
                              />
                            </div>
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
                          onClick={(e: React.MouseEvent) => {
                            const url = `/workflows/${item.id}${searchQuery ? `?highlight=${encodeURIComponent(searchQuery)}` : ""}`;
                            if (e.ctrlKey || e.metaKey) {
                              window.open(url, "_blank");
                            } else {
                              navigate(url);
                            }
                          }}
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
                          <TableCell className="text-muted-foreground">
                            {item.createdBy?.name || "—"}
                          </TableCell>
                          <TableCell>
                            {item.status === "Completo" ? (
                              <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 hover:bg-green-100">
                                Completo
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="cursor-default bg-muted text-foreground hover:bg-muted dark:bg-muted/40"
                              >
                                {item.status || "Em andamento"}
                              </Badge>
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
                    <div className="flex items-center gap-3">
                      <p className="text-sm text-muted-foreground">
                        Página{" "}
                        <span className="font-medium">{currentPage}</span> de{" "}
                        <span className="font-medium">{totalPages}</span>
                        {" "}({totalItems} {totalItems === 1 ? "item" : "itens"})
                      </p>
                      <input
                        type="number"
                        min={1}
                        max={totalPages}
                        defaultValue={currentPage}
                        key={currentPage}
                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                          if (e.key === "Enter") {
                            const val = parseInt((e.target as HTMLInputElement).value, 10);
                            if (!isNaN(val) && val >= 1 && val <= totalPages) {
                              setCurrentPage(val);
                            }
                          }
                        }}
                        onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val) && val >= 1 && val <= totalPages) {
                            setCurrentPage(val);
                          }
                        }}
                        className="w-16 h-7 text-center text-sm rounded border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
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
