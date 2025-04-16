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
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { SL } from "../../components";
import { FaInbox, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { StyleContext } from "../../reducers/style.reducer";

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
        Nenhum aceite encontrado
      </p>
      <p
        className="text-base"
        style={{ color: styleContext.state.textColor, opacity: 0.7 }}
      >
        Você ainda não possui nenhum aceite registrado.
      </p>
    </div>
  );
}

export function MyAcceptances(): JSX.Element {
  const [data, setData] = useState<any>([]);
  const pageSize = 10;
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const styleContext = useContext(StyleContext);

  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage === Math.ceil(data.length / pageSize) - 1;

  const nextPage = () => {
    if (!isLastPage) {
      setCurrentPage((currentPage) => {
        handleFetchAcceptances(currentPage + 1);
        return currentPage + 1;
      });
    }
  };

  const prevPage = () => {
    if (!isFirstPage) {
      setCurrentPage((currentPage) => {
        handleFetchAcceptances(currentPage - 1);
        return currentPage - 1;
      });
    }
  };

  const handleFetchAcceptances = async (page = 1, limit = 10) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACK_END_API}/protocols/acceptances/my`,
        {
          params: {
            page,
            limit,
          },
          headers: {
            authorization: `${localStorage.getItem("token")}`,
          },
        }
      );

      setData(response.data);
    } catch (e) {
      console.warn(e);
    }

    setLoading(false);
  };

  useEffect(() => {
    handleFetchAcceptances();
  }, []);

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
        Meus Aceites
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
                        Pedido
                      </Th>
                      <Th
                        className={
                          styleContext.state.buttonHoverColorWeight === "200"
                            ? "bg-gray-100"
                            : "bg-gray-800"
                        }
                        style={{ color: styleContext.state.textColor }}
                      >
                        Tipo
                      </Th>
                      <Th
                        className={
                          styleContext.state.buttonHoverColorWeight === "200"
                            ? "bg-gray-100"
                            : "bg-gray-800"
                        }
                        style={{ color: styleContext.state.textColor }}
                      >
                        Data
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {data.map((item: any, index: number) => (
                      <Tr
                        key={index}
                        onClick={() =>
                          navigate(`/protocol/${item.protocol}/document`)
                        }
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
                          <Badge
                            colorScheme={
                              styleContext.state.buttonHoverColorWeight ===
                              "200"
                                ? "blue"
                                : "blue"
                            }
                            bg={
                              styleContext.state.buttonHoverColorWeight ===
                              "200"
                                ? "blue.400"
                                : "blue.700"
                            }
                            color="white"
                            fontSize="sm"
                          >
                            {item.protocol}
                          </Badge>
                        </Td>
                        <Td style={{ color: styleContext.state.textColor }}>
                          <Tooltip label={item.type} placement="top">
                            <span>{item.type}</span>
                          </Tooltip>
                        </Td>
                        <Td
                          style={{
                            color: styleContext.state.textColor,
                            opacity: 0.7,
                          }}
                        >
                          {formatDate(item.timestamp)}
                        </Td>
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
                style={{ backgroundColor: styleContext.state.backgroundColor }}
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
                      <span className="font-medium">{currentPage + 1}</span> de{" "}
                      <span className="font-medium">
                        {Math.ceil(data.length / pageSize)}
                      </span>
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
      )}
    </div>
  );
}
