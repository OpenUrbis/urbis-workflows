import { IField, IFormContext, TableOptions } from "@open-urbis/types";
import { FieldView } from "../FieldView";
import { useState, useEffect } from "react";

export type FieldTableViewProps = {
  table: IField[][] | string;
  options: TableOptions;
  value: any;
  general: IFormContext;
};

export const TableView: React.FC<FieldTableViewProps> = ({
  table,
  options,
  value,
  general,
}) => {
  const [parsedTable, setParsedTable] = useState<IField[][] | null>(null);

  useEffect(() => {
    if (typeof table === "string") {
      try {
        const parsed = JSON.parse(table);
        if (
          Array.isArray(parsed) &&
          parsed.every((row) => Array.isArray(row))
        ) {
          setParsedTable(parsed);
        } else {
          setParsedTable(null);
        }
      } catch {
        setParsedTable(null);
      }
    } else {
      setParsedTable(table);
    }
  }, [table]);

  if (!parsedTable?.length || !parsedTable[0]?.length) {
    return null;
  }

  return (
    <div className="flex flex-col" style={{ width: options.width }}>
      <div className="rounded-md border overflow-hidden">
        {parsedTable.map((row, rowIndex) => {
          return (
            <div className="flex" key={`row-${rowIndex}`}>
              {row.map((field, colIndex) => {
              if (field.type === "integration" || field.type === "link") {
                return <></>;
              }

              return (field.type as any) !== "none" ? (
                <div
                  className={`border-l px-4 pt-3 border-t ${
                    colIndex + 1 === row.length ? "border-r" : ""
                  } ${rowIndex + 1 === parsedTable.length ? "border-b" : ""}`}
                  style={{
                    width: `${
                      (((field.options as TableOptions).columns ?? row.length) /
                        (options.columns ?? 1)) *
                      100
                    }%`,
                  }}
                >
                  <FieldView
                    key={field.key}
                    general={general}
                    field={field}
                    value={value?.[field.key]}
                    context={value}
                  />
                </div>
              ) : (
                <div
                  className={`border-l ${colIndex + 1 === row.length ? "border-r" : ""}`}
                  style={{
                    width: `${
                      (((field.options as TableOptions).columns ?? row.length) /
                        (options.columns ?? 1)) *
                      100
                    }%`,
                  }}
                ></div>
              );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
