import React from "react";
import { BlockOptions } from "@open-urbis/types";
import { Field } from "./Field";
import { Step } from "./fields";
import { FieldBlockProps } from "./utils/types";

export const FieldBlock: React.FC<FieldBlockProps> = ({
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
            const randomFallbackKey = Math.random()
              .toString(36)
              .substring(2, 15);

            return (
              <div
                key={`${(f.options as any).key ?? f.key ?? randomFallbackKey}`}
                className="mb-4"
              >
                <Field
                  parent={parent}
                  context={value}
                  validContext={valid}
                  general={general}
                  field={f}
                  value={value?.[(f.options as any).key ?? f.key]}
                  valid={valid?.[(f.options as any).key ?? f.key]}
                  onChange={(value) => {
                    onChange((f.options as any).key ?? f.key, value);
                  }}
                  onValidChange={(valid) => {
                    onValidChange((f.options as any).key ?? f.key, valid);
                  }}
                ></Field>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};
