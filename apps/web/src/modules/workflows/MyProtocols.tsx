import React, { useEffect, useState, useContext } from "react";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  Center,
  Tooltip,
  Badge,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { SL } from "../../components";
import { ApiClient } from "../../api";
import { WorkflowMetadata } from "../../api/types/workflows.dto";
import { useSnackbar } from "../../hooks/snackbar";
import {
  FaInbox,
  FaChevronLeft,
  FaChevronRight,
  FaCode,
  FaFlask,
  FaRocket,
  FaLink,
} from "react-icons/fa";
import { StyleContext } from "../../reducers/style.reducer";
import { formatId } from "./activities/common";
import { usePermissions } from "../../reducers/permission.context";

const api = new ApiClient({
  baseURL: process.env.REACT_APP_BACK_END_API || "",
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

function EmptyState() {
  const styleContext = useContext(StyleContext);
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-300px)]">
      <FaInbox
        size={48}
        className={
          styleContext.state.buttonHoverColorWeight === "200"
            ? "text-gray-400"
            : "text-gray-500"
        }
      />
      <p
        className="text-xl font-medium mt-4 mb-2"
        style={{ color: styleContext.state.textColor }}
      >
        Nenhum protocolo encontrado
      </p>
      <p
        className="text-base"
        style={{ color: styleContext.state.textColor, opacity: 0.7 }}
      >
        Você ainda não possui nenhum protocolo registrado.
      </p>
      <p
        className="text-sm mt-2"
        style={{ color: styleContext.state.textColor, opacity: 0.5 }}
      >
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
  const styleContext = useContext(StyleContext);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <h1
        className="text-2xl md:text-3xl font-medium mt-6"
        style={{ color: styleContext.state.textColor }}
      >
        Meus Pedidos
      </h1>

      {loading ? (
        <Center py={16}>
          <Spinner
            size="xl"
            color={
              styleContext.state.buttonHoverColorWeight === "200"
                ? "yellow.500"
                : "yellow.300"
            }
            thickness="3px"
          />
        </Center>
      ) : (
        <>
          <div className="flex justify-between items-center">
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
          </div>

          <div
            className={`rounded-lg overflow-hidden border transition-all duration-200 ${
              styleContext.state.buttonHoverColorWeight === "200"
                ? "border-gray-200"
                : "border-gray-700"
            }`}
            style={{ backgroundColor: styleContext.state.backgroundColor }}
          >
            {data.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table variant="simple" size="lg">
                    <Thead>
                      <Tr>
                        <Th
                          className={
                            styleContext.state.buttonHoverColorWeight === "200"
                              ? "bg-gray-100"
                              : "bg-gray-800"
                          }
                          style={{ color: styleContext.state.textColor }}
                        >
                          Protocolo
                        </Th>
                        <Th
                          className={
                            styleContext.state.buttonHoverColorWeight === "200"
                              ? "bg-gray-100"
                              : "bg-gray-800"
                          }
                          style={{ color: styleContext.state.textColor }}
                        >
                          Assunto
                        </Th>
                        <Th
                          className={
                            styleContext.state.buttonHoverColorWeight === "200"
                              ? "bg-gray-100"
                              : "bg-gray-800"
                          }
                          style={{ color: styleContext.state.textColor }}
                        >
                          Criado
                        </Th>
                        <Th
                          className={
                            styleContext.state.buttonHoverColorWeight === "200"
                              ? "bg-gray-100"
                              : "bg-gray-800"
                          }
                          style={{ color: styleContext.state.textColor }}
                        >
                          Atualizado
                        </Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {data.map((item) => (
                        <Tr
                          key={item.id}
                          onClick={() => navigate(`/workflows/${item.id}`)}
                          className={`cursor-pointer transition-colors duration-200 ${
                            styleContext.state.buttonHoverColorWeight === "200"
                              ? "hover:bg-gray-50"
                              : "hover:bg-gray-700"
                          }`}
                          style={{
                            backgroundColor: styleContext.state.backgroundColor,
                          }}
                        >
                          <Td>
                            <div className="flex items-center space-x-1">
                              <Badge colorScheme="blue" fontSize="sm">
                                {formatId(item.id)}
                              </Badge>
                              <Tooltip
                                label="Copiado!"
                                placement="top"
                                hasArrow
                                isOpen={tooltipItem === item.id}
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(item.id);
                                    setTooltipItem(item.id);
                                    setTimeout(
                                      () => setTooltipItem(null),
                                      1500
                                    );
                                  }}
                                  className={`p-1 rounded transition-colors ${
                                    styleContext.state
                                      .buttonHoverColorWeight === "200"
                                      ? "hover:bg-gray-100"
                                      : "hover:bg-gray-600"
                                  }`}
                                >
                                  <FaLink
                                    size={12}
                                    color={styleContext.state.textColor}
                                  />
                                </button>
                              </Tooltip>
                            </div>
                          </Td>
                          <Td>
                            <Tooltip label={item.label} placement="top">
                              <span
                                style={{ color: styleContext.state.textColor }}
                              >
                                {item.label}
                              </span>
                            </Tooltip>
                          </Td>
                          <Td>{formatDate(String(item.createdAt))}</Td>
                          <Td>{formatDate(String(item.updatedAt))}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </div>

                <div
                  className={`px-4 py-3 flex items-center justify-between border-t transition-colors duration-200 ${
                    styleContext.state.buttonHoverColorWeight === "200"
                      ? "border-gray-200"
                      : "border-gray-700"
                  }`}
                  style={{
                    backgroundColor: styleContext.state.backgroundColor,
                  }}
                >
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={prevPage}
                      disabled={isFirstPage}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md transition-colors duration-200 ${
                        styleContext.state.buttonHoverColorWeight === "200"
                          ? "border-gray-300 text-gray-700 hover:bg-gray-50"
                          : "border-gray-600 text-gray-200 hover:bg-gray-700"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      Anterior
                    </button>
                    <button
                      onClick={nextPage}
                      disabled={isLastPage}
                      className={`ml-3 relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md transition-colors duration-200 ${
                        styleContext.state.buttonHoverColorWeight === "200"
                          ? "border-gray-300 text-gray-700 hover:bg-gray-50"
                          : "border-gray-600 text-gray-200 hover:bg-gray-700"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      Próximo
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p
                        style={{ color: styleContext.state.textColor }}
                        className="text-sm"
                      >
                        Página{" "}
                        <span className="font-medium">{currentPage}</span> de{" "}
                        <span className="font-medium">{totalPages}</span>
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={prevPage}
                        disabled={isFirstPage}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white transition-colors duration-200 ${
                          styleContext.state.buttonHoverColorWeight === "200"
                            ? "bg-yellow-500 hover:bg-yellow-600"
                            : "bg-yellow-600 hover:bg-yellow-700"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <FaChevronLeft className="mr-2" />
                        Anterior
                        <SL
                          bg={
                            styleContext.state.buttonHoverColorWeight === "200"
                              ? "yellow.600"
                              : "yellow.700"
                          }
                        >
                          ←
                        </SL>
                      </button>
                      <button
                        onClick={nextPage}
                        disabled={isLastPage}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white transition-colors duration-200 ${
                          styleContext.state.buttonHoverColorWeight === "200"
                            ? "bg-yellow-500 hover:bg-yellow-600"
                            : "bg-yellow-600 hover:bg-yellow-700"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        Próximo
                        <FaChevronRight className="ml-2" />
                        <SL
                          bg={
                            styleContext.state.buttonHoverColorWeight === "200"
                              ? "yellow.600"
                              : "yellow.700"
                          }
                        >
                          →
                        </SL>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
