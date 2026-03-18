import React, { useCallback, useEffect, useState } from "react";
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

function hasLoadedDwgData(v: unknown): boolean {
  if (v == null || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  const keys = Object.keys(o);
  if (keys.length === 0) return false;
  if (o.s3_metadata) return true;
  return keys.some((k) =>
    ["dados", "geometrias", "features", "blocos", "value"].includes(k),
  );
}

export const MapPickerField: React.FC<FieldMapPickerProps> = ({
  fieldKey,
  options,
  value,
  onChange,
}) => {
  const [justLoaded, setJustLoaded] = useState(false);
  useEffect(() => {
    if (value == null || (typeof value === "object" && Object.keys(value as object).length === 0)) {
      setJustLoaded(false);
    } else if (hasLoadedDwgData(value)) {
      setJustLoaded(true);
    }
  }, [value]);

  const handleChange = useCallback(
    (data: unknown) => {
      if (data != null && typeof data === "object" && Object.keys(data).length > 0) {
        setJustLoaded(true);
      }
      onChange?.(data);
    },
    [onChange]
  );

  const loaded = justLoaded || hasLoadedDwgData(value);

  return (
    <div
      key={fieldKey}
      style={{
        width: options?.width ?? "100%",
        borderRadius: "1rem",
        ...(loaded
          ? {
              minHeight: "min(640px, 80vh)",
              height: "auto",
              overflow: "visible",
            }
          : {
              height: options?.height ?? "400px",
              minHeight: "320px",
              overflow: "hidden",
            }),
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
