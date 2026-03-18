import React, { useContext, useEffect } from "react";
import {
  ArrayOptions,
  BlockOptions,
  IField,
  IFieldOptionsType,
  IFormContext,
  InputOptions,
} from "@open-urbis/types";
import { FieldBlockView } from "./FieldBlockView";
import {
  Checkbox,
  FieldCheckboxProps,
  FieldInputProps,
  FieldMapProps,
  FieldMapPickerProps,
  FieldMapPerimeterProps,
  FieldRadioProps,
  FieldSelectProps,
  FieldTableViewProps,
  FieldTextareaProps,
  FieldUploadProps,
  Integration,
  Label,
  Link,
  Map,
  MapPickerField,
  MapPerimeterField,
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
import { usePermissions } from "../../../reducers/permission.context";

export type FieldViewProps = {
  parent?: IField;
  field: IField;
  context: any;
  value: any;
  general: IFormContext;
  highlightQuery?: string;
};

/**
 * Wraps all occurrences of `query` in `text` with <mark> tags (case-insensitive).
 * Returns an HTML string safe for dangerouslySetInnerHTML.
 */
function highlightText(text: string, query: string): string {
  if (!query || !text) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  return text.replace(regex, "<mark class='search-highlight'>$1</mark>");
}

/**
 * Renders a text value with optional search highlighting.
 */
function HighlightedValue({ value, query }: { value: any; query?: string }) {
  const text = value ?? "Não informado";
  if (!query || typeof text !== "string" || !text.toLowerCase().includes(query.toLowerCase())) {
    return <span>{text}</span>;
  }
  return (
    <span
      className="[&_.search-highlight]:bg-yellow-200 [&_.search-highlight]:text-yellow-900 [&_.search-highlight]:rounded-sm [&_.search-highlight]:px-0.5 dark:[&_.search-highlight]:bg-yellow-500/30 dark:[&_.search-highlight]:text-yellow-200"
      dangerouslySetInnerHTML={{ __html: highlightText(text, query) }}
    />
  );
}

export const FIELD_COMPONENT_MAP: {
  [field: string]: (...args: any[]) => JSX.Element;
} = {
  input: ({ value, highlightQuery }: FieldInputProps & { highlightQuery?: string }) => (
    <HighlightedValue value={value} query={highlightQuery} />
  ),
  textarea: ({ value, highlightQuery }: FieldTextareaProps & { highlightQuery?: string }) => (
    <HighlightedValue value={value} query={highlightQuery} />
  ),
  select: ({ value, highlightQuery }: FieldSelectProps & { highlightQuery?: string }) => (
    <HighlightedValue value={value} query={highlightQuery} />
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
  radio: ({ value, highlightQuery }: FieldRadioProps & { highlightQuery?: string }) => (
    <HighlightedValue value={value} query={highlightQuery} />
  ),
  upload: ({ field, value }: FieldUploadProps) => {
    if (!field) return <span>{value ?? "Não informado"}</span>;

    const keys = Array.isArray(value) ? value : value ? [value] : [];
    if (keys.length === 0) return <span>{value ?? "Não informado"}</span>;

    return (
      <div>
        {keys.map((key: string, index: number) => (
          <div
            key={`${field.key}-${key}-${index}`}
            className="cursor-pointer"
            onClick={() => downloadFile(key)}
          >
            {key.split("/").pop() ?? key}
          </div>
        ))}
      </div>
    );
  },
  map: ({ fieldKey, options, value }: FieldMapProps) => (
    <Map fieldKey={fieldKey} options={options} value={value} />
  ),
  mapPicker: ({ field, options, value }: FieldMapPickerProps) => (
    <MapPickerField
      field={field}
      fieldKey={field.key}
      options={options}
      value={value}
    />
  ),
  mapPerimeter: ({ field, options, value }: FieldMapPerimeterProps) => (
    <MapPerimeterField
      field={field}
      fieldKey={field.key}
      options={options}
      value={value}
    />
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
  highlightQuery,
}): JSX.Element => {
  const styleContext = useContext(StyleContext);
  const { hasSensibilityAccess } = usePermissions();
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
            {value?.__redacted || !hasSensibilityAccess(options.sensibilityLevel) ? (
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
                    highlightQuery={highlightQuery}
                  />
                ) : (
                  <FieldComponent
                    key={field.key}
                    field={{ ...field, options }}
                    value={value}
                    options={options}
                    general={general}
                    highlightQuery={highlightQuery}
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
              highlightQuery={highlightQuery}
            ></FieldBlockView>
          </>
        )}
        {field.type === "preset" && field.preset && (
          <>
            <FieldBlockView
              field={field.preset}
              general={general}
              value={value}
              highlightQuery={highlightQuery}
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
                    highlightQuery={highlightQuery}
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
