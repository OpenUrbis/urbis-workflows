import React, { memo, useCallback, useRef } from "react";
import { BlockOptions } from "@open-urbis/types";
import { Field } from "./Field";
import { Step } from "./fields";
import { FieldBlockProps } from "./utils/types";

const FieldItem: React.FC<{
  parent: any;
  fieldDef: any;
  fieldKey: string;
  general: any;
  value: any;
  valid: any;
  context: any;
  validContext: any;
  onChange: (key: string, value: any) => void;
  onValidChange: (key: string, valid: any) => void;
}> = memo(({
  parent,
  fieldDef,
  fieldKey,
  general,
  value,
  valid,
  context,
  validContext,
  onChange,
  onValidChange,
}) => {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onValidChangeRef = useRef(onValidChange);
  onValidChangeRef.current = onValidChange;
  const fieldKeyRef = useRef(fieldKey);
  fieldKeyRef.current = fieldKey;

  const handleChange = useCallback((v: any) => {
    onChangeRef.current(fieldKeyRef.current, v);
  }, []);

  const handleValidChange = useCallback((v: any) => {
    onValidChangeRef.current(fieldKeyRef.current, v);
  }, []);

  return (
    <div className="mb-4">
      <Field
        parent={parent}
        context={context}
        validContext={validContext}
        general={general}
        field={fieldDef}
        value={value}
        valid={valid}
        onChange={handleChange}
        onValidChange={handleValidChange}
      />
    </div>
  );
});

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
          {field.map((f) => {
            const fieldKey = (f.options as any).key ?? f.key;
            return (
              <FieldItem
                key={fieldKey}
                parent={parent}
                fieldDef={f}
                fieldKey={fieldKey}
                general={general}
                value={value?.[fieldKey]}
                valid={valid?.[fieldKey]}
                context={value}
                validContext={valid}
                onChange={onChange}
                onValidChange={onValidChange}
              />
            );
          })}
        </div>
      )}
    </>
  );
});
