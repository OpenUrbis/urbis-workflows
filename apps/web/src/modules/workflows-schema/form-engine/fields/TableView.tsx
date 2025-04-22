import { IField, IFormContext, TableOptions } from "@open-urbis/types";
import { FieldView } from "../FieldView";

export type FieldTableViewProps = {
  table: IField[][];
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
  return (
    <div className="flex flex-col" style={{ width: options.width }}>
      {table?.map((row, rowIndex) => {
        return (
          <div className="flex">
            {row.map((field) => {
              if (field.type === "integration" || field.type === "link") {
                return <></>;
              }

              return (field.type as any) !== "none" ? (
                <div
                  className={`border-x px-4 pt-3 border-t ${
                    rowIndex + 1 === table.length ? "border-b" : ""
                  }`}
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
