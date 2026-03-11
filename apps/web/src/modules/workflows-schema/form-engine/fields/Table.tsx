import { useState, useContext, useEffect, useMemo } from "react";
import { FaTable } from "react-icons/fa";
import { IField, IFormContext, TableOptions } from "@open-urbis/types";
import { Field } from "../Field";
import { StyleContext } from "../../../../reducers/style.reducer";

export type FieldTableProps = {
  table: IField[][] | string;
  options: TableOptions;
  value: any;
  valid: any;
  general: IFormContext;
  onChange: (value: any) => void;
  onValidChange: (valid: any) => void;
};

export const Table: React.FC<FieldTableProps> = ({
  table,
  options,
  general,
  value = {},
  valid = {},
  onChange,
  onValidChange,
}) => {
  const styleContext = useContext(StyleContext);
  const [localValue, setLocalValue] = useState(value);
  const [localValid, setLocalValid] = useState(valid);
  const [parsedTable, setParsedTable] = useState<IField[][] | null>(null);

  // Memoize the field value to prevent unnecessary re-renders
  const getFieldValue = useMemo(() => {
    return (fieldKey: string) => {
      return localValue?.[fieldKey] ?? null;
    };
  }, [localValue]);

  // Memoize the field valid state to prevent unnecessary re-renders
  const getFieldValid = useMemo(() => {
    return (fieldKey: string) => {
      return localValid?.[fieldKey] ?? null;
    };
  }, [localValid]);

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
    return (
      <div className="flex items-start space-x-4 py-4 text-gray-500">
        <FaTable size={24} className="mt-1 opacity-50" />
        <div>
          <p
            className="text-sm mb-1"
            style={{ color: styleContext.state.textColor }}
          >
            Nenhuma linha e coluna configurada
          </p>
          <p
            className="text-xs"
            style={{ color: styleContext.state.textColor }}
          >
            Configure as colunas nas propriedades do campo
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ width: options.width }}>
      <div className="rounded-md border overflow-hidden">
        {parsedTable.map((row, rowIndex) => {
          return (
            <div className="flex" key={`row-${rowIndex}`}>
              {row.map((field, colIndex) => {
              const uniqueKey = `${rowIndex}-${colIndex}-${field.key || "empty"}`;

              if (field.type === "integration" || field.type === "link") {
                return (
                  <div className="w-0" key={uniqueKey}>
                    <Field
                      parent={field}
                      general={general}
                      field={field}
                      value={getFieldValue(field.key)}
                      valid={getFieldValid(field.key)}
                      onChange={(v) => {
                        setLocalValue((value: any) => {
                          const newValue = { ...value, [field.key]: v };
                          queueMicrotask(() => onChange(newValue));
                          return newValue;
                        });
                      }}
                      onValidChange={(v) => {
                        setLocalValid((valid: any) => {
                          const newValid = { ...valid, [field.key]: v };
                          queueMicrotask(() => onValidChange(newValid));
                          return newValid;
                        });
                      }}
                      context={value}
                      validContext={valid}
                    />
                  </div>
                );
              }

              return (field.type as any) !== "none" ? (
                <div
                  key={uniqueKey}
                  className={`border-l border-t ${
                    colIndex + 1 === row.length ? "border-r" : ""
                  } ${rowIndex + 1 === parsedTable.length ? "border-b" : ""} ${
                    field.type !== "array" ? "px-4 py-3" : ""
                  }`}
                  style={{
                    width: `${
                      (((field.options as TableOptions).columns ?? row.length) /
                        (options.columns ?? 1)) *
                      100
                    }%`,
                  }}
                >
                  <Field
                    parent={field}
                    general={general}
                    field={field}
                    value={getFieldValue(field.key)}
                    valid={getFieldValid(field.key)}
                    onChange={(v) => {
                      setLocalValue((value: any) => {
                        const newValue = { ...value, [field.key]: v };
                        queueMicrotask(() => onChange(newValue));
                        return newValue;
                      });
                    }}
                    onValidChange={(v) => {
                      setLocalValid((valid: any) => {
                        const newValid = { ...valid, [field.key]: v };
                        queueMicrotask(() => onValidChange(newValid));
                        return newValid;
                      });
                    }}
                    context={value}
                    validContext={valid}
                  />
                </div>
              ) : (
                <div
                  key={uniqueKey}
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
