import React from "react";
import { ArrayOptions, IField, IFormContext } from "@open-urbis/types";
import { FieldBlock } from "../FieldBlock";
import { Button } from "@open-urbis/map-ui";
import { FaPlus, FaTrash } from "react-icons/fa";
import { Field } from "../Field";

export type FieldArrayProps = {
  field: IField;
  options: ArrayOptions;
  general: IFormContext;
  value: any[];
  valid: { [key: string]: boolean }[];
  onChange: (value: any[]) => void;
  onValidChange: (valid: { [key: string]: boolean }[]) => void;
};

export const ArrayField: React.FC<FieldArrayProps> = ({
  field,
  options,
  general,
  value = [],
  valid,
  onChange,
  onValidChange,
}): JSX.Element => {
  const handleAdd = () => {
    if (value === undefined || value === null) {
      value = [];
    }
    if (
      valid === undefined ||
      valid === null ||
      typeof valid !== "object" ||
      valid?.[0]?.$ === false
    ) {
      valid = [];
    }

    value.push({});
    valid.push({});

    onChange(value);
    onValidChange(valid);
  };

  const handleDelete = (index: number) => {
    value.splice(index, 1);
    onChange(value);

    // because the valid value of the array is also dynamically setted based on the
    // value of optios.required, in some instances the valid value is a boolean
    // so we need to handle this case
    if (typeof valid === "object") {
      valid?.splice(index, 1);
      onValidChange(valid);
    }
  };

  const isReadonly =
    options.readOnly === true ||
    (general?.$state === "edition" && options.enableEdition !== true);

  if (options.layout === "table") {
    const block = (field?.block ?? []) as IField[];

    return (
      <>
        <div className="flex flex-col" style={{ width: options.width }}>
          {options.hideHeader !== true && (
            <div className="flex">
              {block.map((f, index) => {
                return (
                  <div
                    className={`px-4 py-3 border-b ${
                      index < block.length ? "border-r" : ""
                    } ${index > 0 ? "border-l" : ""}`}
                    style={{
                      width: `${
                        (((f.options as ArrayOptions).columns ?? 1) /
                          (options.columns ?? block.length)) *
                        100
                      }%`,
                    }}
                  >
                    {(f.options as ArrayOptions).label}
                  </div>
                );
              })}
            </div>
          )}
          {value?.map((positionValue, positionIndex) => {
            return (
              <div className="flex relative">
                {!isReadonly && (
                  <div
                    className="absolute mt-4 pr-10"
                    style={{ left: "-52px" }}
                  >
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="h-9 w-9"
                      onClick={() => {
                        handleDelete(positionIndex);
                      }}
                    >
                      <FaTrash size={14} />
                    </Button>
                  </div>
                )}
                {block.map((f, index) => {
                  return (
                    <div
                      className={`px-4 py-3 border-b ${
                        index < block.length ? "border-r" : ""
                      } ${index > 0 ? "border-l" : ""}`}
                      style={{
                        width: `${
                          (((f.options as ArrayOptions).columns ?? 1) /
                            (options.columns ?? block.length)) *
                          100
                        }%`,
                      }}
                    >
                      <Field
                        parent={field}
                        general={general}
                        field={{ ...f, options: { ...f.options, label: "" } }}
                        value={positionValue[f.key]}
                        valid={undefined}
                        onChange={(v) => {
                          value[positionIndex] = {
                            ...value[positionIndex],
                            [f.key]: v,
                          };
                          onChange(value);
                        }}
                        onValidChange={(v: boolean) => {
                          valid[positionIndex] = {
                            ...valid[positionIndex],
                            [f.key]: v,
                          };

                          if (valid?.length > 0 && valid?.[0]?.$ === false) {
                            delete valid[0].$;
                          }

                          onValidChange(valid);
                        }}
                        context={positionValue}
                        validContext={valid[positionIndex]}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}
          {!isReadonly && (
            <div className="flex justify-center p-4">
              <Button
                type="button"
                size="sm"
                className="h-9 px-4 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={handleAdd}
              >
                <FaPlus />
              </Button>
            </div>
          )}
        </div>
      </>
    );
  } else if (options.layout === undefined) {
    return (
      <>
        {value?.map((v, index) => {
          return (
            <div className="flex flex-col p-6 border rounded-md space-y-4 mb-4">
              {!isReadonly && (
                <div className="flex items-center space-x-4 font-bold">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="h-9 w-9"
                    onClick={() => {
                      handleDelete(index);
                    }}
                  >
                    <FaTrash size={14} />
                  </Button>
                </div>
              )}
              <div>
                <FieldBlock
                  parent={field}
                  field={field.block ?? []}
                  general={general}
                  value={v}
                  valid={valid[index]}
                  onChange={(k, v) => {
                    value[index] = {
                      ...value[index],
                      [k]: v,
                    };
                    onChange(value);
                  }}
                  onValidChange={(k, v) => {
                    valid[index] = {
                      ...valid[index],
                      [k]: v,
                    };

                    if (valid?.length > 0 && valid?.[0]?.$ === false) {
                      delete valid[0].$;
                    }

                    onValidChange(valid);
                  }}
                ></FieldBlock>
              </div>
            </div>
          );
        })}
        {!isReadonly && (
          <div className="flex justify-center">
            <Button
              type="button"
              size="sm"
              className="h-9 px-4 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={handleAdd}
            >
              <FaPlus />
              <span>{options.label}</span>
            </Button>
          </div>
        )}
      </>
    );
  } else if (!isReadonly) {
    return (
      <div className="flex justify-center">
        <Button
          type="button"
          size="sm"
          className="h-9 px-4 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={handleAdd}
        >
          <FaPlus />
          <span>{options.label}</span>
        </Button>
      </div>
    );
  } else {
    return <></>;
  }
};
