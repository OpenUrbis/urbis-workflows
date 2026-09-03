import React from "react";
import { FieldView } from "./FieldView";
import { FieldBlockViewProps } from "./utils/types";

export const FieldBlockView: React.FC<FieldBlockViewProps> = ({
  field,
  general,
  value,
  highlightQuery,
}): JSX.Element => {
  return (
    <>
      {field.map((f) => {
        // some fields dont have a key, so we need to generate a random one
        const randomFallbackKey = Math.random().toString(36).substring(2, 15);

        return (
          <div key={`${f.key ?? randomFallbackKey}`} className="mb-4">
            <FieldView
              context={value}
              general={{
                ...general,
                $history: general?.$history?.[(f.options as any).key ?? f.key],
              }}
              field={f}
              value={value?.[(f.options as any).key ?? f.key]}
              highlightQuery={highlightQuery}
            ></FieldView>
          </div>
        );
      })}
    </>
  );
};
