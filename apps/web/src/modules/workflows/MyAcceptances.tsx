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
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { SL } from "../../components";
import { Loader2 } from "lucide-react";
import { FaInbox, FaChevronLeft, FaChevronRight } from "react-icons/fa";

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-300px)]">
      <FaInbox size={48} className="text-muted-foreground" />
      <p className="text-xl font-medium mt-4 mb-2 text-foreground">
        Nenhuma assinatura encontrada
      </p>
      <p className="text-base text-muted-foreground">
        Você ainda não possui nenhuma assinatura registrada.
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
        `${import.meta.env.VITE_BACK_END_API}/protocols/acceptances/my`,
        {
          params: {
            page,
            limit,
          },
          headers: {
            authorization: `${getAccessToken()}`,
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
      <h1 className="text-2xl font-semibold mt-4 tracking-tight text-foreground">
        Minhas Assinaturas
      </h1>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Card className="overflow-hidden">
          {data.length === 0 ? (
            <EmptyState />
          ) : (
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <TooltipProvider>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="bg-muted/40">
                          Pedido
                        </TableHead>
                        <TableHead className="bg-muted/40">
                          Tipo
                        </TableHead>
                        <TableHead className="bg-muted/40">
                          Data
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.map((item: any, index: number) => (
                        <TableRow
                          key={index}
                          onClick={() =>
                            navigate(`/protocol/${item.protocol}/document`)
                          }
                          className="cursor-pointer"
                        >
                          <TableCell>
                            <Badge variant="secondary" className="font-medium">
                              {item.protocol}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="line-clamp-1">{item.type}</span>
                              </TooltipTrigger>
                              <TooltipContent>{item.type}</TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(item.timestamp)}
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
                      <span className="font-medium">{currentPage + 1}</span> de{" "}
                      <span className="font-medium">
                        {Math.ceil(data.length / pageSize)}
                      </span>
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
      )}
    </div>
  );
}
