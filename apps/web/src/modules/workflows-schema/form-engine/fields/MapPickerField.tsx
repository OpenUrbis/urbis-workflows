import React, { useCallback } from "react";
import { MapDataIntegrationField } from "@open-urbis/map";
import { MapOptions as BaseMapOptions } from "@open-urbis/types";

/**
 * New map field type using @open-urbis/map (MapDataIntegrationField).
 * DWG / project data field ("mapPicker"). Legacy read-only map remains type "map".
 * Same props contract as other form fields (field, options, value, onChange) for retrocompatibility.
 */
export type FieldMapPickerProps = {
  field: { key: string };
  fieldKey: string;
  options: BaseMapOptions & { width?: string; height?: string };
  value?: unknown;
  onChange?: (value: unknown) => void;
};

export const MapPickerField: React.FC<FieldMapPickerProps> = ({
  fieldKey,
  options,
  value,
  onChange,
}) => {
  const handleChange = useCallback(
    (data: unknown) => {
      onChange?.(data);
    },
    [onChange]
  );

  return (
    <div
      key={fieldKey}
      style={{
        width: options?.width ?? "100%",
        height: options?.height ?? "400px",
        minHeight: "320px",
        borderRadius: "1rem",
        overflow: "hidden",
      }}
    >
      <MapDataIntegrationField
        mode={onChange ? "edit" : "view"}
        initialData={value ?? undefined}
        onChange={handleChange}
      />
    </div>
  );
};
