import React, { useContext, useEffect, useState } from "react";
import Papa from "papaparse";
import { FaTrash, FaPlus, FaFileImport, FaTable } from "react-icons/fa";
import EditableHeader from "../../../components/EditableHeader";
import { StyleContext } from "../../../reducers";
import { IconButton, Tooltip } from "../../../components";

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
  const borderColor = isDarkMode ? "#4b5563" : "#e5e7eb";
  const hoverBgColor = isDarkMode ? "#374151" : "#f3f4f6";
  const bgColor = isDarkMode ? "#1f2937" : "#ffffff";
  const emptyTableBg = isDarkMode ? "#374151" : "#f9fafb";

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
    <div
      className="p-8 text-center rounded-md border border-dashed"
      style={{ backgroundColor: emptyTableBg, borderColor }}
    >
      <FaTable
        size={40}
        color={isDarkMode ? "#4A5568" : "#CBD5E0"}
        className="mx-auto mb-4"
      />
      <div className="mb-4 text-lg" style={{ color: styleContext.state.textColor }}>
        Nenhum dado na tabela
      </div>
      {!isDisabled && (
        <div className="flex justify-center gap-4">
          <button
            type="button"
            onClick={addColumn}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
              isDarkMode
                ? "border-gray-600 text-gray-100 hover:bg-gray-700"
                : "border-gray-200 text-gray-900 hover:bg-gray-100"
            }`}
          >
            <FaPlus />
            Adicionar coluna
          </button>
          <label
            htmlFor="csv-upload-empty"
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border cursor-pointer transition-colors ${
              isDarkMode
                ? "border-gray-600 text-gray-100 hover:bg-gray-700"
                : "border-gray-200 text-gray-900 hover:bg-gray-100"
            }`}
          >
            <FaFileImport />
            Importar CSV
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            id="csv-upload-empty"
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="dynamic-table-container">
      {data.headers.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
            <div
              className={`text-sm px-2 py-1 rounded-md border ${
                isDarkMode
                  ? "bg-gray-800 border-gray-600 text-gray-100"
                  : "bg-white border-gray-200 text-gray-900"
              }`}
            >
              {data.rows.length} {data.rows.length === 1 ? "linha" : "linhas"} ×{" "}
              {data.headers.length}{" "}
              {data.headers.length === 1 ? "coluna" : "colunas"}
            </div>

            {!isDisabled && (
              <div className="flex gap-2 flex-wrap">
                <Tooltip label="Adicionar coluna">
                  <button
                    type="button"
                    onClick={addColumn}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
                      isDarkMode
                        ? "border-gray-600 text-gray-100 hover:bg-gray-700"
                        : "border-gray-200 text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    <FaPlus />
                    Coluna
                  </button>
                </Tooltip>

                <Tooltip label="Adicionar linha">
                  <button
                    type="button"
                    onClick={addRow}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
                      isDarkMode
                        ? "border-gray-600 text-gray-100 hover:bg-gray-700"
                        : "border-gray-200 text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    <FaPlus />
                    Linha
                  </button>
                </Tooltip>

                <Tooltip label="Importar CSV">
                  <label
                    htmlFor="csv-upload"
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border cursor-pointer transition-colors ${
                      isDarkMode
                        ? "border-gray-600 text-gray-100 hover:bg-gray-700"
                        : "border-gray-200 text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    <FaFileImport />
                    Importar CSV
                  </label>
                </Tooltip>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                />
              </div>
            )}
          </div>

          <div
            className="w-full overflow-y-auto"
            style={{
              borderWidth: 1,
              borderStyle: "solid",
              borderColor,
              borderRadius: 6,
              maxHeight: 600,
            }}
          >
            <table className="w-full text-sm">
              <thead
                style={{
                  position: "sticky" as any,
                  top: 0,
                  zIndex: 1,
                  backgroundColor: bgColor,
                  borderBottom: `1px solid ${borderColor}`,
                }}
              >
                <tr>
                  {data.headers.map((header, index) => (
                    <th
                      key={`header-${index}`}
                      className="text-left font-semibold"
                      style={{
                        textTransform: "none",
                        borderColor,
                        paddingTop: 12,
                        paddingBottom: 12,
                        paddingLeft: 12,
                        paddingRight: 12,
                        borderBottom: `1px solid ${borderColor}`,
                      }}
                    >
                      <div className="flex items-center justify-between">
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
                          <Tooltip label="Remover coluna">
                            <IconButton
                              aria-label="delete column"
                              icon={<FaTrash />}
                              onClick={() => deleteColumn(index)}
                              className="ml-2"
                            />
                          </Tooltip>
                        )}
                      </div>
                    </th>
                  ))}
                  {!isDisabled && (
                    <th style={{ width: 50, borderBottom: `1px solid ${borderColor}` }} />
                  )}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, rowIndex) => (
                  <tr
                    key={`row-${rowIndex}`}
                    onMouseEnter={(e) => {
                      (e.currentTarget as any).style.backgroundColor = hoverBgColor;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as any).style.backgroundColor = "";
                    }}
                  >
                    {data.headers.map((header, colIndex) => (
                      <td
                        key={`cell-${rowIndex}-${colIndex}`}
                        style={{
                          borderBottom: `1px solid ${borderColor}`,
                          paddingLeft: 12,
                          paddingRight: 12,
                          paddingTop: 8,
                          paddingBottom: 8,
                        }}
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
                      </td>
                    ))}
                    {!isDisabled && (
                      <td
                        style={{
                          width: 50,
                          borderBottom: `1px solid ${borderColor}`,
                          paddingLeft: 8,
                          paddingRight: 8,
                        }}
                      >
                        <Tooltip label="Remover linha">
                          <IconButton
                            aria-label="delete row"
                            icon={<FaTrash />}
                            onClick={() => deleteRow(rowIndex)}
                          />
                        </Tooltip>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default DynamicTable;
