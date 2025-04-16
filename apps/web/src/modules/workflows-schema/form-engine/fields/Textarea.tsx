import React, { useState, useEffect, useCallback, useContext } from "react";
import { Textarea as TextAreaBase } from "@chakra-ui/react";
import debounce from "lodash.debounce";
import { IField, IFormContext, TextAreaOptions } from "@open-urbis/types";
import { modelCallback } from "../utils/expressions";
import { CodeEditor } from "../../components/CodeEditor";
import { StyleContext } from "../../../../reducers/style.reducer";

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
  const styleContext = useContext(StyleContext);
  const lightBgColor = "#fafafa";
  const darkBgColor = "#2D3748";

  useEffect(() => {
    const modelExpression = field?.expressions?.model;
    if (modelExpression) {
      const processedExpression = modelExpression.replace(
        /context\.\$(?!metadata|data)/g,
        `context["${field.key}"]`
      );

      if (!processedExpression.includes(`context["${field.key}"]`)) {
        modelCallback(field, value, context, general, valid, (updatedValue) => {
          setValue(updatedValue);
          onChange(updatedValue);
        });
      }
    }
    
  }, [context, field.expressions?.model]);

  
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
    <TextAreaBase
      key={fieldKey}
      placeholder={options?.placeholder}
      size="lg"
      onChange={handleChange}
      className="flex-grow"
      value={value}
      disabled={isReadonly}
      style={{
        backgroundColor:
          styleContext.state.buttonHoverColorWeight === "200"
            ? lightBgColor
            : darkBgColor,
        color: styleContext.state.textColor,
        borderColor:
          styleContext.state.buttonHoverColorWeight === "200"
            ? "gray.200"
            : "gray.600",
      }}
      _hover={{
        borderColor:
          styleContext.state.buttonHoverColorWeight === "200"
            ? "gray.300"
            : "gray.500",
      }}
      _focus={{
        borderColor:
          styleContext.state.buttonHoverColorWeight === "200"
            ? "blue.500"
            : "blue.300",
        boxShadow:
          styleContext.state.buttonHoverColorWeight === "200"
            ? "0 0 0 1px var(--chakra-colors-blue-500)"
            : "0 0 0 1px var(--chakra-colors-blue-300)",
      }}
      // Focus management using a delayed approach to prevent scroll jumping
      // and ensure the component is fully rendered before focusing.
      // The delay of 0ms still moves the focus call to the next event loop tick,
      // which is enough to avoid focus-related issues.
      ref={(input) => {
        if (input && options.autoFocus) {
          setTimeout(() => {
            input.focus();
          }, 0);
        }
      }}
    />
  );
};
