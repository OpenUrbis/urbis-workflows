import React, { useCallback, useEffect, useRef, useState } from "react";
import { MapDataIntegrationField } from "@open-urbis/map";
import {
  IField,
  IFormContext,
  MapOptions as BaseMapOptions,
} from "@open-urbis/types";
import { FiMaximize2, FiX } from "react-icons/fi";

/**
 * New map field type using @open-urbis/map (MapDataIntegrationField).
 * DWG / project data field ("mapPicker"). Legacy read-only map remains type "map".
 */
export type FieldMapPickerProps = {
  field: IField;
  fieldKey: string;
  options: BaseMapOptions & { width?: string; height?: string };
  value?: unknown;
  onChange?: (value: unknown) => void;
  general?: IFormContext;
  valid?: boolean;
  onValidChange?: (valid: boolean) => void;
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

/** Scoped overrides for @open-urbis/map MapDataStructuredView (right column only). */
const MAP_SIDEBAR_SCROLL_CSS = `
            /* Radix ScrollArea: allow horizontal pan when labels extend past sidebar width */
            .map-picker-field-wrapper .grid > div:nth-child(2) [data-radix-scroll-area-viewport] {
              overflow-x: auto !important;
            }

            /* Accordion triggers + grid rows: scroll long labels instead of clipping (truncate) */
            .map-picker-field-wrapper .grid > div:nth-child(2) .flex.items-center.gap-2.overflow-hidden {
              overflow-x: auto !important;
              overflow-y: hidden !important;
              min-width: 0;
              -webkit-overflow-scrolling: touch;
            }

            .map-picker-field-wrapper .grid > div:nth-child(2) .truncate {
              overflow: visible !important;
              text-overflow: clip !important;
              white-space: nowrap !important;
            }
`;

export const MapPickerField: React.FC<FieldMapPickerProps> = ({
  fieldKey,
  options,
  value,
  onChange,
  valid,
}) => {
  const showInvalid = options?.required === true && valid === false;
  const invalidRing =
    "ring-2 ring-destructive/80 ring-offset-2 ring-offset-background rounded-2xl";

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [mapInstanceKey, setMapInstanceKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [justLoaded, setJustLoaded] = useState(false);
  useEffect(() => {
    if (
      value == null ||
      (typeof value === "object" && Object.keys(value as object).length === 0)
    ) {
      setJustLoaded(false);
    } else if (hasLoadedDwgData(value)) {
      setJustLoaded(true);
    } else {
      // Prevent loading-specific sizing while we're still in "uploading/processing" states.
      setJustLoaded(false);
    }
  }, [value]);

  const handleChange = useCallback(
    (data: unknown) => {
      // Only switch to "loaded" sizing when we actually have the DWG payload we can render.
      setJustLoaded(hasLoadedDwgData(data));
      onChange?.(data);
    },
    [onChange],
  );

  const loaded = justLoaded || hasLoadedDwgData(value);
  const hasExplicitHeight =
    typeof options?.height === "string" && options.height.trim().length > 0;
  const wrapperHeight = hasExplicitHeight
    ? options.height
    : loaded
      ? "min(640px, 66vh)"
      : "400px";

  // ResizeObserver: mapbox-gl needs a resize signal when the container size changes
  // (e.g. inside modals). Remounting the map ensures correct initialization.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    let timeout: number | undefined;
    const ro = new ResizeObserver(() => {
      if (timeout) window.clearTimeout(timeout);
      timeout = window.setTimeout(() => {
        setMapInstanceKey((k) => k + 1);
      }, 150);
    });

    ro.observe(el);
    return () => {
      if (timeout) window.clearTimeout(timeout);
      ro.disconnect();
    };
  }, [fieldKey, isFullscreen]);

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[2000] bg-background">
        <button
          type="button"
          aria-label="Fechar mapa"
          onClick={() => setIsFullscreen(false)}
          className="absolute top-4 right-4 z-[2001] p-2 rounded-full bg-background/80 hover:bg-background border shadow-sm transition-colors"
        >
          <FiX size={18} />
        </button>

        <div
          className={`map-picker-field-wrapper ${showInvalid ? invalidRing : ""}`}
          ref={wrapperRef}
          data-invalid={showInvalid || undefined}
          aria-invalid={showInvalid || undefined}
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 0,
            minHeight: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            position: "relative",
          }}
        >
          <style>{`
            /* Fullscreen: allow lib to layout map + sidebar together.
               Keep only hard sizing overrides so mapbox canvas fits. */
            .map-picker-field-wrapper .w-full.flex.flex-col.gap-4 { height: 100% !important; }
            .map-picker-field-wrapper .h-\\[600px\\] { height: 100% !important; }
            .map-picker-field-wrapper .min-h-\\[300px\\] { min-height: 0 !important; }
            .map-picker-field-wrapper .min-h-\\[400px\\] { min-height: 0 !important; }

            /* In fullscreen, keep the Ficha as a right sidebar (side-by-side). */
            @media (min-width: 768px) {
              .map-picker-field-wrapper .md\\:grid-cols-2 {
                grid-template-columns: 2fr 1fr !important;
              }
            }

            ${MAP_SIDEBAR_SCROLL_CSS}
          `}</style>

          <div style={{ height: "100%", width: "100%" }}>
            <MapDataIntegrationField
              key={`map-data-integration-${mapInstanceKey}`}
              mode={onChange ? "edit" : "view"}
              initialData={value ?? undefined}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      key={fieldKey}
      className={`map-picker-field-wrapper ${showInvalid ? invalidRing : ""}`}
      ref={wrapperRef}
      data-invalid={showInvalid || undefined}
      aria-invalid={showInvalid || undefined}
      style={{
        width: options?.width ?? "100%",
        borderRadius: "1rem",
        height: wrapperHeight,
        // Important for modal layouts: allow this flex item to shrink without pushing siblings.
        minHeight: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* 
        @open-urbis/map uses internal hard-coded heights (h-[600px], min-h-[300px]) that
        can make this widget overflow when placed inside modals.
        We scope overrides to this wrapper so the internal grid respects our container height.
      */}
      <style>{`
        /* Ensure the MapDataIntegrationField root and its grid can size off our wrapper height. */
        .map-picker-field-wrapper .w-full.flex.flex-col.gap-4 { height: 100% !important; }
        .map-picker-field-wrapper .h-\\[600px\\] { height: 100% !important; }
        .map-picker-field-wrapper .min-h-\\[300px\\] { min-height: 0 !important; }
        /* MapPreview uses a min-height that can force overflow inside constrained modals. */
        .map-picker-field-wrapper .min-h-\\[400px\\] { min-height: min(340px, 42vh) !important; }

        /* Keep the "Ficha Técnica" as a right sidebar (map + sidebar). */
        @media (min-width: 768px) {
          .map-picker-field-wrapper .md\\:grid-cols-2 {
            grid-template-columns: 2fr 1fr !important;
          }
        }

        ${MAP_SIDEBAR_SCROLL_CSS}
      `}</style>

      <button
        type="button"
        aria-label="Expandir mapa em tela cheia"
        onClick={() => setIsFullscreen(true)}
        className="absolute bottom-3 right-3 z-50 p-2 rounded-full bg-background/80 hover:bg-background border shadow-sm transition-colors"
      >
        <FiMaximize2 size={18} />
      </button>

      <div style={{ height: "100%", width: "100%" }}>
        <MapDataIntegrationField
          key={`map-data-integration-${mapInstanceKey}`}
          mode={onChange ? "edit" : "view"}
          initialData={value ?? undefined}
          onChange={handleChange}
        />
      </div>
    </div>
  );
};
