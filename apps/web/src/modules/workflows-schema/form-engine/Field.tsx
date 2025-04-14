import React, { useEffect, useState } from "react";
import {
  ArrayOptions,
  BlockOptions,
  IField,
  IFieldOptionsType,
  IFormContext,
  IntegrationOptions,
  SubtitleOptions,
} from "@open-urbis/types";
import { FieldBlock } from "./FieldBlock";
import {
  Checkbox,
  FieldCheckboxProps,
  FieldInputProps,
  FieldMapProps,
  FieldRadioProps,
  FieldSelectProps,
  FieldTableProps,
  FieldTextareaProps,
  FieldUploadProps,
  Input,
  Integration,
  Link,
  Map,
  Paragraph,
  Radio,
  Select,
  Table,
  Textarea,
  Title,
  Upload,
} from "./fields";
import { HelpTooltipClickable } from "../../../components";
import {
  integrationCallback,
  modelCallback,
  optionCallback,
  validCallback,
  visibleCallback,
} from "./utils/expressions";
import { ArrayField } from "./fields/Array";
import { Spinner } from "@chakra-ui/react";
import { FieldProps } from "./utils/types";
import { RenderValidState } from "./components/RenderValidState";
import { RenderLabelTooltip } from "./components/RenderLabelTooltip";
import { InputFieldTypes } from "./utils/types";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

export interface ValidState {
  type: "valid" | "invalid" | "warning" | "information";
  message: string;
}

export const FIELD_COMPONENT_MAP: {
  [field: string]: (...args: any[]) => JSX.Element;
} = {
  input: ({
    field,
    fieldKey,
    options,
    onChange,
    value,
    context,
    valid,
    general,
  }: FieldInputProps) => (
    <Input
      field={field}
      fieldKey={fieldKey}
      onChange={onChange}
      options={options}
      value={value}
      context={context}
      valid={valid}
      general={general}
    />
  ),
  textarea: ({
    field,
    fieldKey,
    options,
    onChange,
    value,
    context,
    valid,
    general,
  }: FieldTextareaProps) => (
    <Textarea
      field={field}
      fieldKey={fieldKey}
      onChange={onChange}
      options={options}
      value={value}
      context={context}
      valid={valid}
      general={general}
    />
  ),
  select: ({
    field,
    fieldKey,
    options,
    onChange,
    value,
    general,
  }: FieldSelectProps) => (
    <Select
      field={field}
      fieldKey={fieldKey}
      onChange={onChange}
      options={options}
      value={value}
      general={general}
    />
  ),
  checkbox: ({
    field,
    fieldKey,
    options,
    onChange,
    value,
    general,
  }: FieldCheckboxProps) => (
    <Checkbox
      field={field}
      fieldKey={fieldKey}
      onChange={onChange}
      options={options}
      value={value}
      general={general}
    />
  ),
  radio: ({
    field,
    fieldKey,
    options,
    onChange,
    value,
    general,
  }: FieldRadioProps) => (
    <Radio
      field={field}
      fieldKey={fieldKey}
      onChange={onChange}
      options={options}
      value={value}
      general={general}
    />
  ),
  upload: ({
    field,
    fieldKey,
    options,
    onChange,
    value,
    general,
  }: FieldUploadProps) => (
    <Upload
      field={field}
      fieldKey={fieldKey}
      onChange={onChange}
      options={options}
      value={value}
      general={general}
    />
  ),
  map: ({ fieldKey, options, value }: FieldMapProps) => (
    <Map fieldKey={fieldKey} options={options} value={value} />
  ),
  table: ({
    options,
    onChange,
    onValidChange,
    general,
    value,
    valid,
  }: FieldTableProps) => (
    <Table
      table={options.table}
      options={options}
      general={general}
      value={value}
      valid={valid}
      onChange={onChange}
      onValidChange={onValidChange}
    />
  ),
};

export const useFieldDynamic = (
  field: IField,
  context: any,
  validContext: any,
  general: IFormContext,
  value: any,
  onChange: (value: any) => void,
  onValidChange: (valid: any) => void
) => {
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(
    field.expressions?.visible ? false : true
  );
  const [options, setOptions] = useState<IFieldOptionsType>(
    field.options ?? {}
  );
  const [validState, setValidState] = useState<boolean | ValidState>(true);

  useEffect(() => {
    optionCallback(field, context, general, validContext, setOptions);
    validCallback(
      field,
      context,
      general,
      validContext,
      setValidState,
      onValidChange
    );
    visibleCallback(field, context, general, validContext, setVisible);
    if (
      (field.type !== "input" && field.type !== "textarea") ||
      visible === false //
    ) {
      // If the field is not an input or textarea, or if it is not visible,
      // we don't need to run the modelCallback. The modelCallback is used
      // inside the <Input> and <Textarea> components to update the value.
      // This is because the value of the input need to be controlled by the
      // component to be reactive to its own changes.
      modelCallback(field, value, context, general, validContext, onChange);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    context,
    field.expressions?.model,
    field.expressions?.options,
    field.expressions?.valid,
    field.expressions?.visible,
  ]);

  useEffect(() => {
    integrationCallback(
      field,
      context,
      general,
      validContext,
      value,
      setLoading,
      onChange
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context, general.$data, field.expressions?.integration]);

  return { loading, visible, options, validState, setOptions };
};

export const Field: React.FC<FieldProps> = ({
  parent,
  context,
  validContext,
  general,
  field,
  value,
  valid,
  onChange,
  onValidChange,
}): JSX.Element => {
  const { loading, visible, options, validState, setOptions } = useFieldDynamic(
    field,
    context,
    validContext,
    general,
    value,
    onChange,
    onValidChange
  );

  const [localValue, setLocalValue] = useState(value);
  const [localValid, setLocalValid] = useState(valid);
  const isOpen = (options as BlockOptions)?.open ?? true; // Default to true if not set

  const FieldComponent = FIELD_COMPONENT_MAP[field.type] || (() => <></>);

  if (visible) {
    return (
      <div className="w-full">
        {field.type === "title" && (
          <Title key={field.key} options={field.options as any} />
        )}
        {field.type === "subtitle" && (
          <div className="flex items-center space-x-4">
            <Paragraph key={field.key} options={field.options as any} />
            {(field.options as SubtitleOptions).tooltip && (
              <div>
                <HelpTooltipClickable
                  tooltip={(field.options as SubtitleOptions).tooltip as string}
                />
              </div>
            )}
          </div>
        )}
        {field.type === "link" && <Link value={value} general={general} />}
        {field.type === "integration" && (
          <>
            <Integration
              field={field}
              options={options as IntegrationOptions}
              value={value}
            />
            {loading && <Spinner />}
          </>
        )}
        {parent && InputFieldTypes.includes(field.type) && (
          <>
            <RenderLabelTooltip
              parent={parent}
              options={options}
              field={field}
              context={context}
              general={general}
            />
            <FieldComponent
              field={field}
              key={field.key}
              options={options}
              general={general}
              value={value}
              valid={valid}
              context={context}
              onChange={onChange}
              onValidChange={onValidChange}
            />
          </>
        )}
        {field.type === "block" && field.block && (
          <div
            className={`${
              (field.options as BlockOptions).card
                ? `w-full rounded ${
                    (field.options as BlockOptions).hideCardBorder
                      ? "border-none px-6 pt-6"
                      : "border border-gray-200 p-6"
                  }`
                : ""
            }`}
          >
            {(field.options as BlockOptions).card && (
              <div className="flex items-center space-x-2 text-lg mb-6">
                <div className="flex items-center space-x-3 flex-1">
                  <label className="font-medium">
                    {(field.options as BlockOptions).label}
                  </label>
                  {(field.options as BlockOptions).tooltip && (
                    <HelpTooltipClickable
                      tooltip={
                        (field.options as BlockOptions).tooltip as string
                      }
                    />
                  )}
                </div>
                {(field.options as BlockOptions).toggle !== false && (
                  <div
                    className="flex items-center space-x-2 cursor-pointer text-blue-500 hover:text-blue-700 transition-colors"
                    onClick={() => {
                      setOptions({
                        ...options,
                        open: !isOpen,
                      } as BlockOptions);
                    }}
                  >
                    {isOpen ? (
                      <>
                        <FaChevronUp size={14} />
                        <span className="text-sm">Recolher</span>
                      </>
                    ) : (
                      <>
                        <FaChevronDown size={14} />
                        <span className="text-sm">Expandir</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
            {isOpen && (
              <FieldBlock
                parent={{ ...field, options }}
                field={field.block}
                general={general}
                layout={(field.options as BlockOptions).layout}
                value={localValue}
                valid={localValid}
                onChange={(k, v) => {
                  setLocalValue((current: any) => {
                    const newLocalValue = { ...current, [k]: v };
                    onChange(newLocalValue);
                    return newLocalValue;
                  });
                }}
                onValidChange={(k, v) => {
                  setLocalValid((current: any) => {
                    const newLocalValid = { ...current, [k]: v };
                    onValidChange(newLocalValid);
                    return newLocalValid;
                  });
                }}
              />
            )}
          </div>
        )}
        {field.type === "preset" && field.preset && (
          <FieldBlock
            parent={field}
            field={field.preset}
            general={general}
            layout={(field.options as BlockOptions).layout}
            value={localValue}
            valid={localValid}
            onChange={(k, v) => {
              setLocalValue((current: any) => {
                const newLocalValue = { ...current, [k]: v };
                onChange(newLocalValue);
                return newLocalValue;
              });
            }}
            onValidChange={(k, v) => {
              setLocalValid((current: any) => {
                const newLocalValid = { ...current, [k]: v };
                onValidChange(newLocalValid);
                return newLocalValid;
              });
            }}
          />
        )}
        {parent && field.type === "array" && (
          <div>
            <RenderLabelTooltip
              parent={parent}
              options={options}
              field={field}
              context={context}
              general={general}
            />
            <ArrayField
              field={field}
              options={options as ArrayOptions}
              general={general}
              value={value ?? []}
              valid={valid ?? []}
              onChange={onChange}
              onValidChange={onValidChange}
            />
          </div>
        )}

        <div className="mt-4">
          <RenderValidState validState={validState} />
        </div>
      </div>
    );
  } else {
    return <></>;
  }
};
