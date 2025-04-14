import React, { useContext, useEffect } from "react";
import {
  ArrayOptions,
  BlockOptions,
  IField,
  IFieldOptionsType,
  IFormContext,
  InputOptions,
  UploadOptions,
} from "@open-urbis/types";
import { FieldBlockView } from "./FieldBlockView";
import {
  Checkbox,
  FieldCheckboxProps,
  FieldInputProps,
  FieldMapProps,
  FieldRadioProps,
  FieldSelectProps,
  FieldTableViewProps,
  FieldTextareaProps,
  FieldUploadProps,
  Integration,
  Label,
  Link,
  Map,
  Paragraph,
  TableView,
  Title,
} from "./fields";
import { HelpTooltipClickable } from "../../../components";
import { downloadFile } from "./utils/utils";
import { optionCallback, visibleCallback } from "./utils/expressions";
import { InputFieldTypes } from "./utils/types";
import { VersionsMenu } from "../components/VersionsMenu";
import { RenderFieldPrivacyInfo } from "./components/RenderFieldPrivacyInfo";
import { RenderFieldModelCalculation } from "./components/RenderFieldModelCalculation";
import { StyleContext } from "../../../reducers";

export type FieldViewProps = {
  parent?: IField;
  field: IField;
  context: any;
  value: any;
  general: IFormContext;
};

export const FIELD_COMPONENT_MAP: {
  [field: string]: (...args: any[]) => JSX.Element;
} = {
  input: ({ value }: FieldInputProps) => (
    <span>{value ?? "Não informado"}</span>
  ),
  textarea: ({ value }: FieldTextareaProps) => (
    <span>{value ?? "Não informado"}</span>
  ),
  select: ({ value }: FieldSelectProps) => (
    <span>{value ?? "Não informado"}</span>
  ),
  checkbox: ({ field, value, general }: FieldCheckboxProps) => (
    <Checkbox
      field={field}
      fieldKey={field.key}
      onChange={() => {}}
      options={{ ...field.options, readOnly: true } as any}
      value={value}
      general={general}
    />
  ),
  radio: ({ value }: FieldRadioProps) => (
    <span>{value ?? "Não informado"}</span>
  ),
  upload: ({ field, value }: FieldUploadProps) => {
    if (!field) return <span>{value ?? "Não informado"}</span>;

    return (
      <div>
        {value.length > 0 ? (
          (value as string[]).map((file: string, index: number) => (
            <div
              key={`${field.key}-${file}-${index}`}
              className="cursor-pointer"
              onClick={() =>
                downloadFile((field?.options as UploadOptions).dir, file)
              }
            >
              {file}
            </div>
          ))
        ) : (
          <span>{value ?? "Não informado"}</span>
        )}
      </div>
    );
  },
  map: ({ fieldKey, options, value }: FieldMapProps) => (
    <Map fieldKey={fieldKey} options={options} value={value} />
  ),
  table: ({ options, value, general }: FieldTableViewProps) => (
    <TableView
      table={options.table as IField[][]}
      options={options as any}
      value={value}
      general={general}
    />
  ),
};

export const FieldView: React.FC<FieldViewProps> = ({
  parent,
  context,
  general,
  field,
  value,
}): JSX.Element => {
  const styleContext = useContext(StyleContext);
  const [visible, setVisible] = React.useState(
    field.expressions?.visible ? false : true
  );
  const [options, setOptions] = React.useState<IFieldOptionsType>(
    field.options ?? {}
  );
  const [version, setVersion] = React.useState<{ version: number }>({
    version:
      general?.$history?.length > 0
        ? general?.$history[general.$history.length - 1].version
        : -1,
  });

  useEffect(() => {
    visibleCallback(field, context, general, {}, setVisible);
    optionCallback(field, context, general, {}, setOptions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context]);

  const FieldComponent = FIELD_COMPONENT_MAP[field.type] || (() => <></>);
  const dynamicVersionValue =
    general?.$history && general?.$history?.length > 0
      ? general?.$history.find((v: any) => v.version === version.version)?.value
      : value;

  if (visible) {
    return (
      <div className="w-full mb-6">
        {field.type === "title" && (
          <Title key={field.key} options={field.options as any} />
        )}
        {field.type === "subtitle" && (
          <Paragraph key={field.key} options={field.options as any} />
        )}
        {field.type === "link" && <Link value={value} general={general} />}
        {field.type === "integration" && (
          <Integration field={field} options={options} value={value} />
        )}
        {InputFieldTypes.includes(field.type) && (
          <>
            <div className="flex items-start space-x-4 font-bold">
              {(field.options as InputOptions).label && (
                <Label
                  fieldKey={field.key}
                  context={context}
                  options={field.options as any}
                />
              )}
              <RenderFieldPrivacyInfo
                sensibilityLevel={options.sensibilityLevel}
                accessLevel={options.accessLevel}
                permissions={options.permissions}
              />
              <RenderFieldModelCalculation
                parent={parent ?? field}
                field={field}
                general={general}
              />
              {(field.options as InputOptions).tooltip && (
                <HelpTooltipClickable
                  tooltip={(field.options as InputOptions).tooltip as string}
                />
              )}
              {general?.$history && general?.$history?.length > 0 && (
                <VersionsMenu
                  defaultVersion={version}
                  versions={general.$history}
                  callback={(version) => {
                    setVersion({ version });
                  }}
                ></VersionsMenu>
              )}
            </div>
            {value?.__redacted ? (
              <div
                className={`font-medium ${
                  styleContext.state.textColor === "#ffffff"
                    ? "text-gray-400"
                    : "text-gray-600"
                }`}
              >
                [Regidido por política de privacidade]
              </div>
            ) : (
              <>
                {general?.$history && general?.$history?.length > 0 ? (
                  <FieldComponent
                    key={field.key}
                    field={{ ...field, options }}
                    value={dynamicVersionValue}
                    options={options}
                    general={general}
                  />
                ) : (
                  <FieldComponent
                    key={field.key}
                    field={{ ...field, options }}
                    value={value}
                    options={options}
                    general={general}
                  />
                )}
              </>
            )}
          </>
        )}
        {field.type === "block" && field.block && (
          <>
            {field.key !== "root" && (
              <div className="mb-4">
                <h1 className="text-2xl font-bold">
                  {(field.options as BlockOptions).label}
                </h1>
              </div>
            )}
            <FieldBlockView
              field={field.block}
              general={general}
              value={value}
            ></FieldBlockView>
          </>
        )}
        {field.type === "preset" && field.preset && (
          <>
            <FieldBlockView
              field={field.preset}
              general={general}
              value={value}
            />
          </>
        )}
        {field.type === "array" && field.block && (
          <>
            <div className="flex items-start space-x-4 font-bold">
              {(field.options as ArrayOptions).label && (
                <Label
                  fieldKey={field.key}
                  context={context}
                  options={field.options as any}
                />
              )}
              {(field.options as ArrayOptions).tooltip && (
                <HelpTooltipClickable
                  tooltip={(field.options as ArrayOptions).tooltip as string}
                />
              )}
              {general?.$history && general?.$history?.length > 0 && (
                <VersionsMenu
                  defaultVersion={version}
                  versions={general.$history}
                  callback={(version) => {
                    setVersion({ version });
                  }}
                ></VersionsMenu>
              )}
            </div>
            {dynamicVersionValue?.map((v: any, index: number) => {
              return (
                <div
                  key={`${field.key}-array-item-${index}`}
                  className={`border p-6 rounded-md ${index > 0 ? "mt-4" : ""}`}
                >
                  <FieldBlockView
                    field={field.block ?? []}
                    general={{
                      ...general,
                      $history: general?.$history?.[index],
                    }}
                    value={v}
                  />
                </div>
              );
            })}
          </>
        )}
      </div>
    );
  } else {
    return <></>;
  }
};
