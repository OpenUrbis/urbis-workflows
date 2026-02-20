import React, { useState, useEffect, useCallback } from "react";
import { Textarea as DSTextarea } from "@open-urbis/map-ui";
import debounce from "lodash.debounce";
import { IField, IFormContext, TextAreaOptions } from "@open-urbis/types";
import { modelCallback } from "../utils/expressions";
import { CodeEditor } from "../../components/CodeEditor";

export type FieldTextareaProps = {
  field: IField;
  fieldKey: string;
  options: TextAreaOptions;
  value?: string | number;
  general: IFormContext;
  context?: any;
  valid?: any;
  onChange: (value: string) => void;
};

export const Textarea: React.FC<FieldTextareaProps> = ({
  field,
  fieldKey,
  onChange,
  options,
  value: propValue,
  general,
  context,
  valid,
}) => {
  const [value, setValue] = useState(propValue);

  useEffect(() => {
    const modelExpression = field?.expressions?.model;
    if (modelExpression) {
      const processedExpression = modelExpression.replace(
        /context\.\$(?!metadata|data)/g,
        `context["${field.key}"]`
      );

      if (
        value === undefined ||
        !processedExpression.includes(`context["${field.key}"]`)
      ) {
        modelCallback(field, value, context, general, valid, (updatedValue) => {
          setValue(updatedValue);
          onChange(updatedValue);
        });
      }
    }
  }, [context, general.$data, field.expressions?.model]);

  const debouncedOnChange = useCallback(
    debounce((value) => {
      onChange(value);
    }, 300),
    [onChange]
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { selectionStart, selectionEnd } = e.target;
    const newValue = e.target.value;

    const modelExpression =
      field?.expressions?.model?.replace(
        /context\.\$(?!metadata|data)/g,
        `context["${field.key}"]`
      ) ?? "";

    if (modelExpression.includes(`context["${field.key}"]`)) {
      modelCallback(
        field,
        value,
        { ...context, [field.key]: newValue },
        general,
        valid,
        (updatedValue) => {
          setValue(updatedValue);
          debouncedOnChange(updatedValue);

          // Restore cursor position after the update
          requestAnimationFrame(() => {
            e.target.setSelectionRange?.(selectionStart, selectionEnd);
          });
        }
      );
    } else {
      setValue(newValue);
      debouncedOnChange(newValue);
    }
  };

  const isReadonly =
    options.readOnly === true ||
    (general?.$state === "edition" && options.enableEdition !== true);

  if (options.code) {
    return (
      <CodeEditor
        value={value?.toString() ?? ""}
        onChange={(newValue: string) => {
          setValue(newValue);
          debouncedOnChange(newValue);
        }}
        language="javascript"
        height="200px"
        readOnly={isReadonly}
      />
    );
  }

  return (
    <DSTextarea
      key={fieldKey}
      placeholder={options?.placeholder}
      onChange={handleChange}
      className="flex-grow min-h-[120px]"
      value={value}
      readOnly={isReadonly}
      disabled={isReadonly}
      autoFocus={options.autoFocus}
    />
  );
};
