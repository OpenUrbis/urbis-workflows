import React, { memo, useMemo } from "react";
import { BlockOptions } from "@open-urbis/types";
import { Field } from "./Field";
import { Step } from "./fields";
import { FieldBlockProps } from "./utils/types";

export const FieldBlock: React.FC<FieldBlockProps> = memo(({
  parent,
  field,
  general,
  layout = "block",
  value,
  valid,
  onChange,
  onValidChange,
}): JSX.Element => {
  const fieldElements = useMemo(() => {
    return field.map((f) => {
      const fieldKey = (f.options as any).key ?? f.key;
      return (
        <div
          key={fieldKey}
          className="mb-4"
        >
          <Field
            parent={parent}
            context={value}
            validContext={valid}
            general={general}
            field={f}
            value={value?.[fieldKey]}
            valid={valid?.[fieldKey]}
            onChange={(value) => {
              onChange(fieldKey, value);
            }}
            onValidChange={(valid) => {
              onValidChange(fieldKey, valid);
            }}
          ></Field>
        </div>
      );
    });
  }, [field, parent, value, valid, general, onChange, onValidChange]);

  return (
    <>
      {layout === "step" && (
        <Step
          field={field}
          general={general}
          value={value}
          valid={valid}
          onChange={onChange}
          onValidChange={onValidChange}
        />
      )}
      {layout === "block" && (
        <div
          className={`${
            (parent.options as BlockOptions).card &&
            (parent.options as BlockOptions).open === false
              ? "hidden"
              : ""
          }`}
        >
          {fieldElements}
        </div>
      )}
    </>
  );
});
