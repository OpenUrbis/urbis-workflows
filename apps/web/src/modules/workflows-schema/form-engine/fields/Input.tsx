import React, { useState, useEffect, useCallback, useContext } from "react";
import { Input as InputBase } from "../../../../components";
import { evalFieldExpression, modelCallback } from "../utils/expressions";
import debounce from "lodash.debounce";
import { NumericFormat } from "react-number-format";
import { MaskedInput } from "../../../../components";
import { IField, IFormContext, InputOptions } from "@open-urbis/types";
import { StyleContext } from "../../../../reducers/style.reducer";

export type FieldInputProps = {
  field: IField;
  fieldKey: string;
  onChange: (value: string) => void;
  options: InputOptions;
  value?: string | number;
  context?: any;
  valid?: any;
  general: IFormContext;
};

export const Input: React.FC<FieldInputProps> = ({
  field,
  fieldKey,
  onChange,
  options,
  value: propValue,
  context,
  general,
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
  }, [context, field.expressions?.model]);

  const debouncedOnChange = useCallback(
    debounce((value) => {
      onChange(value);
    }, 300),
    [onChange]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const mask = options?.mask;
  const maskValue = mask
    ? evalFieldExpression(`"${mask}"`, value, {}, {})
    : value;

  if (mask && mask.length > 0) {
    return (
      <MaskedInput
        key={fieldKey}
        mask={maskValue}
        value={value}
        onChange={handleChange}
        placeholder={options?.placeholder}
        size="lg"
        readOnly={isReadonly}
        disabled={isReadonly}
      />
    );
  }

  switch (options.type) {
    case "area":
    case "currency":
    case "percentage":
      return (
        <NumericFormat
          className={`w-full bg-transparent border border-gray-200 rounded-md px-4 py-2.5 ${
            isReadonly ? "cursor-not-allowed opacity-50" : ""
          }`}
          style={{
            fontSize: "1.125rem",
            backgroundColor:
              styleContext.state.buttonHoverColorWeight === "200"
                ? lightBgColor
                : darkBgColor,
            color: styleContext.state.textColor,
          }}
          placeholder={options?.placeholder}
          thousandSeparator="."
          decimalSeparator=","
          prefix={options.type === "currency" ? "R$ " : ""}
          suffix={options.type === "percentage" ? "%" : ""}
          decimalScale={options.decimalScale ?? 2}
          fixedDecimalScale={true}
          allowNegative={false}
          value={value}
          onValueChange={(values) =>
            handleChange({
              target: { value: values.value },
            } as React.ChangeEvent<HTMLInputElement>)
          }
          disabled={isReadonly}
        />
      );
    default:
      return (
        <InputBase
          key={fieldKey}
          type={options?.type ?? "text"}
          placeholder={options?.placeholder}
          size="lg"
          onChange={handleChange}
          value={value}
          readOnly={isReadonly}
          autoFocus={options?.autoFocus}
        />
      );
  }
};
