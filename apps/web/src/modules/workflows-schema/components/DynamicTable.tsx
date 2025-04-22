import React, { useContext, useEffect, useState } from "react";
import Papa from "papaparse";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  IconButton,
  Tooltip,
  Box,
  Flex,
  Button,
  Text,
  Badge,
} from "@chakra-ui/react";
import { FaTrash, FaPlus, FaFileImport, FaTable } from "react-icons/fa";
import EditableHeader from "../../../components/EditableHeader";
import { StyleContext } from "../../../reducers";

interface Row {
  [key: string]: string;
}

interface TableData {
  headers: string[];
  rows: Row[];
}

interface DynamicTableProps {
  value: TableData;
  onChange: (data: TableData) => void;
  isDisabled?: boolean;
}

const DEFAULT_TABLE_DATA: TableData = {
  headers: [],
  rows: [],
};

const isValidTableData = (value: any): value is TableData => {
  return (
    value &&
    typeof value === "object" &&
    Array.isArray(value.headers) &&
    Array.isArray(value.rows) &&
    value.rows.every((row: any) => typeof row === "object")
  );
};

const DynamicTable: React.FC<DynamicTableProps> = ({
  value,
  onChange,
  isDisabled = false,
}) => {
  const [data, setData] = useState<TableData>(() => {
    // Validate initial value format
    if (!isValidTableData(value)) {
      console.warn("Invalid table data format, using default empty table");
      return DEFAULT_TABLE_DATA;
    }
    return value;
  });

  const styleContext = useContext(StyleContext);
  const isDarkMode = styleContext.state.buttonHoverColorWeight === "800";

  // Dynamic colors based on theme
  const borderColor = isDarkMode ? "gray.600" : "gray.200";
  const hoverBgColor = isDarkMode ? "gray.700" : "gray.100";
  const bgColor = isDarkMode ? "gray.800" : "white";
  const buttonColorScheme = isDarkMode ? "blue" : "blue";
  const emptyTableBg = isDarkMode ? "gray.700" : "gray.50";

  useEffect(() => {
    // Only call onChange when data actually changes
    if (JSON.stringify(data) !== JSON.stringify(value)) {
      onChange(data);
    }
  }, [data, onChange, value]);

  const handleHeaderChange = (index: number, value: string) => {
    const oldHeader = data.headers[index];
    const updatedHeaders = [...data.headers];
    updatedHeaders[index] = value;

    const updatedRows = data.rows.map((row) => {
      const newRow = { ...row, [value]: row[oldHeader] };
      delete newRow[oldHeader];
      return newRow;
    });

    setData({ headers: updatedHeaders, rows: updatedRows });
  };

  const handleCellChange = (
    rowIndex: number,
    header: string,
    value: string
  ) => {
    const updatedRows = [...data.rows];
    updatedRows[rowIndex][header] = value;
    setData({ ...data, rows: updatedRows });
  };

  const addColumn = async () => {
    const newHeader = await prompt("Nome da coluna");
    if (newHeader) {
      setData((prevData) => ({
        headers: [...prevData.headers, newHeader],
        rows: prevData.rows.map((row) => ({ ...row, [newHeader]: "" })),
      }));
    }
  };

  const addRow = () => {
    const newRow: Row = data.headers.reduce((acc, header) => {
      acc[header] = "";
      return acc;
    }, {} as Row);
    setData((prevData) => ({
      ...prevData,
      rows: [...prevData.rows, newRow],
    }));
  };

  const deleteColumn = (index: number) => {
    const headerToDelete = data.headers[index];
    setData((prevData) => ({
      headers: prevData.headers.filter((_, i) => i !== index),
      rows: prevData.rows.map((row) => {
        const newRow = { ...row };
        delete newRow[headerToDelete];
        return newRow;
      }),
    }));
  };

  const deleteRow = (index: number) => {
    setData((prevData) => ({
      ...prevData,
      rows: prevData.rows.filter((_, i) => i !== index),
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        complete: (results: any) => {
          const parsedData = results.data as string[][];
          const headers = parsedData[0];
          const rows = parsedData.slice(1).map((row) => {
            return headers.reduce((acc, header, index) => {
              acc[header] = row[index] || "";
              return acc;
            }, {} as Row);
          });
          setData({ headers, rows });
        },
        header: false,
      });
    }
  };

  // Render empty state when no data
  const renderEmptyState = () => (
    <Box
      p={8}
      textAlign="center"
      bg={emptyTableBg}
      borderRadius="md"
      border="1px dashed"
      borderColor={borderColor}
    >
      <FaTable
        size={40}
        color={isDarkMode ? "#4A5568" : "#CBD5E0"}
        className="mx-auto mb-4"
      />
      <Text mb={4} fontSize="lg" color={styleContext.state.textColor}>
        Nenhum dado na tabela
      </Text>
      {!isDisabled && (
        <Flex justifyContent="center" gap={4}>
          <Button
            leftIcon={<FaPlus />}
            onClick={addColumn}
            colorScheme={buttonColorScheme}
            size="sm"
            variant={isDarkMode ? "outline" : "solid"}
          >
            Adicionar coluna
          </Button>
          <Button
            leftIcon={<FaFileImport />}
            as="label"
            htmlFor="csv-upload-empty"
            colorScheme={buttonColorScheme}
            size="sm"
            variant={isDarkMode ? "outline" : "solid"}
            cursor="pointer"
          >
            Importar CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-upload-empty"
              style={{ display: "none" }}
            />
          </Button>
        </Flex>
      )}
    </Box>
  );

  return (
    <Box className="dynamic-table-container">
      {data.headers.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          <Flex
            mb={4}
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
            gap={2}
          >
            <Badge
              colorScheme={buttonColorScheme}
              fontSize="sm"
              px={2}
              py={1}
              borderRadius="md"
            >
              {data.rows.length} {data.rows.length === 1 ? "linha" : "linhas"} ×{" "}
              {data.headers.length}{" "}
              {data.headers.length === 1 ? "coluna" : "colunas"}
            </Badge>

            {!isDisabled && (
              <Flex gap={2} flexWrap="wrap">
                <Tooltip label="Adicionar coluna" placement="top">
                  <Button
                    leftIcon={<FaPlus />}
                    onClick={addColumn}
                    size="sm"
                    colorScheme={buttonColorScheme}
                    variant="outline"
                  >
                    Coluna
                  </Button>
                </Tooltip>

                <Tooltip label="Adicionar linha" placement="top">
                  <Button
                    leftIcon={<FaPlus />}
                    onClick={addRow}
                    size="sm"
                    colorScheme={buttonColorScheme}
                    variant="outline"
                  >
                    Linha
                  </Button>
                </Tooltip>

                <Tooltip label="Importar CSV" placement="top">
                  <Button
                    leftIcon={<FaFileImport />}
                    as="label"
                    htmlFor="csv-upload"
                    size="sm"
                    colorScheme={buttonColorScheme}
                    variant="outline"
                    cursor="pointer"
                  >
                    Importar CSV
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="csv-upload"
                      style={{ display: "none" }}
                    />
                  </Button>
                </Tooltip>
              </Flex>
            )}
          </Flex>

          <TableContainer
            border="1px solid"
            borderColor={borderColor}
            borderRadius="md"
            width="100%"
            maxHeight="600px"
            overflowY="auto"
          >
            <Table variant="simple" size="sm">
              <Thead
                position="sticky"
                top={0}
                zIndex={1}
                bg={bgColor}
                borderBottom="1px solid"
                borderColor={borderColor}
              >
                <Tr>
                  {data.headers.map((header, index) => (
                    <Th
                      key={`header-${index}`}
                      textTransform="none"
                      borderColor={borderColor}
                      py={3}
                    >
                      <Flex alignItems="center" justifyContent="space-between">
                        <EditableHeader
                          value={header}
                          onTextChange={(text) =>
                            handleHeaderChange(index, text)
                          }
                          style={{
                            color: styleContext.state.textColor,
                            minWidth: "50px",
                            maxWidth: "300px",
                            fontWeight: "bold",
                          }}
                          readOnly={isDisabled}
                        />
                        {!isDisabled && (
                          <Tooltip label="Remover coluna" placement="top">
                            <IconButton
                              aria-label="delete column"
                              icon={<FaTrash />}
                              size="xs"
                              ml={2}
                              onClick={() => deleteColumn(index)}
                              isDisabled={isDisabled}
                              colorScheme="red"
                              variant="ghost"
                            />
                          </Tooltip>
                        )}
                      </Flex>
                    </Th>
                  ))}
                  {!isDisabled && (
                    <Th width="50px" borderColor={borderColor}></Th>
                  )}
                </Tr>
              </Thead>
              <Tbody>
                {data.rows.map((row, rowIndex) => (
                  <Tr
                    key={`row-${rowIndex}`}
                    _hover={{ bg: hoverBgColor }}
                    borderColor={borderColor}
                  >
                    {data.headers.map((header, colIndex) => (
                      <Td
                        key={`cell-${rowIndex}-${colIndex}`}
                        borderColor={borderColor}
                      >
                        <EditableHeader
                          value={row[header]}
                          onTextChange={(text) =>
                            handleCellChange(rowIndex, header, text)
                          }
                          style={{
                            minWidth: "30px",
                            color: styleContext.state.textColor,
                          }}
                          readOnly={isDisabled}
                        />
                      </Td>
                    ))}
                    {!isDisabled && (
                      <Td borderColor={borderColor} width="50px">
                        <Tooltip label="Remover linha" placement="left">
                          <IconButton
                            aria-label="delete row"
                            icon={<FaTrash />}
                            size="xs"
                            onClick={() => deleteRow(rowIndex)}
                            isDisabled={isDisabled}
                            colorScheme="red"
                            variant="ghost"
                          />
                        </Tooltip>
                      </Td>
                    )}
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
};

export default DynamicTable;
