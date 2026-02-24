import React, { useState, useEffect, useCallback, useRef, memo } from "react";
import { Input as DSInput } from "@open-urbis/map-ui";
import { evalFieldExpression, modelCallback } from "../utils/expressions";
import debounce from "lodash.debounce";
import { NumericFormat } from "react-number-format";
import { InputMask } from "@react-input/mask";
import { IField, IFormContext, InputOptions } from "@open-urbis/types";

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

export const Input: React.FC<FieldInputProps> = memo(({
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
  const isLocalEdit = useRef(false);

  useEffect(() => {
    if (isLocalEdit.current) {
      return;
    }

    const modelExpression = field?.expressions?.model;
    if (modelExpression) {
      const processedExpression = modelExpression.replace(
        /context\.\.(?!metadata|data)/g,
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

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const debouncedModelEval = useCallback(
    debounce(
      (
        fieldRef: IField,
        currentValue: any,
        newContext: any,
        generalRef: IFormContext,
        validRef: any,
        cb: (v: any) => void
      ) => {
        modelCallback(fieldRef, currentValue, newContext, generalRef, validRef, cb);
      },
      150
    ),
    []
  );

  const debouncedOnChange = useCallback(
    debounce((value: any) => {
      isLocalEdit.current = false;
      onChangeRef.current(value);
    }, 300),
    []
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    isLocalEdit.current = true;

    const modelExpression =
      field?.expressions?.model?.replace(
        /context\.\.(?!metadata|data)/g,
        `context["${field.key}"]`
      ) ?? "";

    if (modelExpression.includes(`context["${field.key}"]`)) {
      // Update local state immediately for responsive typing
      setValue(newValue);

      // Debounce the expensive model expression evaluation
      debouncedModelEval(
        field,
        value,
        { ...context, [field.key]: newValue },
        general,
        valid,
        (updatedValue) => {
          setValue(updatedValue);
          debouncedOnChange(updatedValue);
        }
      );
    } else {
      setValue(newValue);
      debouncedOnChange(newValue);
    }
  };

  useEffect(() => {
    return () => {
      debouncedOnChange.cancel();
      debouncedModelEval.cancel();
    };
  }, [debouncedOnChange, debouncedModelEval]);

  const isReadonly =
    options.readOnly === true ||
    (general?.$state === "edition" && options.enableEdition !== true);

  const mask = options?.mask;
  const maskValue = mask
    ? evalFieldExpression(`"${mask}"`, value, {}, {})
    : value;

  if (mask && mask.length > 0) {
    const convertedMask = String(maskValue ?? "")
      .replace(/9/g, "_")
      .replace(/a/g, "@")
      .replace(/\*/g, "#");

    return (
      <InputMask
        component={DSInput}
        key={fieldKey}
        mask={convertedMask}
        replacement={{
          _: /\d/,
          "@": /[a-zA-Z]/,
          "#": /./,
        }}
        value={value}
        onChange={handleChange}
        placeholder={options?.placeholder}
        className="h-11"
        readOnly={isReadonly}
        disabled={isReadonly}
        autoFocus={options?.autoFocus}
        separate
      />
    );
  }

  switch (options.type) {
    case "area":
    case "currency":
    case "percentage":
      return (
        <NumericFormat
          customInput={DSInput}
          className="h-11"
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
          readOnly={isReadonly}
        />
      );
    default:
      return (
        <DSInput
          key={fieldKey}
          type={options?.type ?? "text"}
          placeholder={options?.placeholder}
          className="h-11"
          onChange={handleChange}
          value={value}
          readOnly={isReadonly}
          disabled={isReadonly}
          autoFocus={options?.autoFocus}
        />
      );
  }
});
