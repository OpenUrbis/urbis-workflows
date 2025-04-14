import { useState, useContext } from "react";
import { FaTable } from "react-icons/fa";
import { IField, IFormContext, TableOptions } from "@open-urbis/types";
import { Field } from "../Field";
import { StyleContext } from "../../../../reducers/style.reducer";

export type FieldTableProps = {
  table: IField[][];
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

  if (!table?.length || !table[0]?.length) {
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
      {table?.map((row, rowIndex) => {
        return (
          <div className="flex">
            {row.map((field) => {
              if (field.type === "integration" || field.type === "link") {
                return (
                  <div className="w-0">
                    <Field
                      parent={field}
                      general={general}
                      field={field}
                      value={localValue?.[field.key]}
                      valid={localValid?.[field.key]}
                      onChange={(v) => {
                        setLocalValue((value: any) => {
                          const newValue = { ...value, [field.key]: v };
                          onChange(newValue);
                          return newValue;
                        });
                      }}
                      onValidChange={(v) => {
                        setLocalValid((valid: any) => {
                          const newValid = { ...valid, [field.key]: v };
                          onValidChange(newValid);
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
                  className={`border-x border-t ${
                    rowIndex + 1 === table.length ? "border-b" : ""
                  } ${field.type !== "array" ? "px-4 py-3" : ""}`}
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
                    value={localValue?.[field.key]}
                    valid={localValid?.[field.key]}
                    onChange={(v) => {
                      setLocalValue((value: any) => {
                        const newValue = { ...value, [field.key]: v };
                        onChange(newValue);
                        return newValue;
                      });
                    }}
                    onValidChange={(v) => {
                      setLocalValid((valid: any) => {
                        const newValid = { ...valid, [field.key]: v };
                        onValidChange(newValid);
                        return newValid;
                      });
                    }}
                    context={value}
                    validContext={valid}
                  />
                </div>
              ) : (
                <div
                  className="border-x"
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
  );
};
