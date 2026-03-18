import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import { MapPicker } from "@open-urbis/map";
import { MapOptions as BaseMapOptions } from "@open-urbis/types";

/** Fallback layer schema when `/maps/config/map` is unavailable (schema editor). Patched MapPicker syncs layerWithRootEditTemplate to this id. */
const MAP_PERIMETER_LAYER_ID = "workflow-schema-perimetro";

const MAP_PERIMETER_LAYER_CONFIG = [
  {
    id: MAP_PERIMETER_LAYER_ID,
    name: "Perímetro (editor)",
    origin: "",
    isActive: true,
    type: "GeoJsonLayer" as const,
    isVisible: true,
    clickAction: { action: "SelectFeature" as const, params: {} },
    viewTemplate: [] as [],
    colors: [] as [],
    layerGroup: { id: "workflow-perimetro", name: "default" },
    properties: {},
  },
];

type GeoJsonGeometry = {
  type?: string;
  coordinates?: any;
};

type GeoJsonFeature = {
  type?: string;
  geometry?: GeoJsonGeometry;
  properties?: Record<string, unknown>;
};

type MapPickerValueLike = {
  type?: string;
  editFeature?: GeoJsonFeature | any;
  intersections?: any;
  perimetroProtocolo?: any;
  [key: string]: any;
};

export type FieldMapPerimeterProps = {
  field: { key: string };
  fieldKey: string;
  options: BaseMapOptions & { width?: string; height?: string };
  value?: unknown;
  onChange?: (value: unknown) => void;
};

function FichaDropdownBody({ value }: { value: MapPickerValueLike }) {
  const resumo = useMemo(() => {
    const editFeature = value?.editFeature ?? value?.perimetroProtocolo;
    const geometry = editFeature?.geometry ?? undefined;
    const coords = editFeature?.geometry?.coordinates ?? undefined;
    return {
      hasPerimetro: !!editFeature,
      geometryType: geometry?.type,
      hasIntersections: value?.intersections !== undefined,
      coordinatesPresent: Array.isArray(coords) || typeof coords === "object",
    };
  }, [value]);

  return (
    <div className="border-t border-border bg-muted/20 px-3 py-3 max-h-[min(320px,42vh)] overflow-y-auto">
      <div className="mb-3 rounded-lg border border-border p-3 bg-card">
        <div className="text-xs font-semibold mb-2 text-muted-foreground">
          Resumo
        </div>
        <pre className="text-xs font-mono whitespace-pre-wrap break-words">
          {JSON.stringify(resumo, null, 2)}
        </pre>
      </div>
      <div className="rounded-lg border border-border p-3 bg-card">
        <div className="text-xs font-semibold mb-2 text-muted-foreground">
          Payload (editFeature + interseções)
        </div>
        <pre className="text-xs font-mono whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
          {JSON.stringify(
            {
              editFeature:
                value?.editFeature ?? value?.perimetroProtocolo ?? null,
              intersections: value?.intersections ?? null,
            },
            null,
            2
          )}
        </pre>
      </div>
    </div>
  );
}

function getEditFeature(value: unknown): any {
  if (!value || typeof value !== "object") return undefined;
  const v = value as MapPickerValueLike;
  return v.editFeature ?? v.perimetroProtocolo;
}

export const MapPerimeterField: React.FC<FieldMapPerimeterProps> = ({
  fieldKey,
  options,
  value,
  onChange,
}) => {
  const [fichaOpen, setFichaOpen] = useState(false);
  const openedFromInitialRef = useRef(false);
  const fichaOpenRef = useRef(fichaOpen);
  fichaOpenRef.current = fichaOpen;
  const flushScheduled = useRef(false);
  const latestPayloadRef = useRef<MapPickerValueLike | null>(null);

  const initialEditFeature = useMemo(() => getEditFeature(value), [value]);

  useEffect(() => {
    if (openedFromInitialRef.current) return;
    if (initialEditFeature) {
      setFichaOpen(true);
      openedFromInitialRef.current = true;
    }
  }, [initialEditFeature]);

  useEffect(() => {
    openedFromInitialRef.current = false;
    setFichaOpen(!!initialEditFeature);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldKey]);

  const handleChange = useCallback(
    (payload: MapPickerValueLike) => {
      latestPayloadRef.current = {
        ...payload,
        perimetroProtocolo: payload?.editFeature ?? payload?.perimetroProtocolo,
      };

      // MapPicker dispara onChange durante o render (signals); adiar evita
      // "Cannot update FieldEditable while rendering a different component".
      if (!flushScheduled.current) {
        flushScheduled.current = true;
        queueMicrotask(() => {
          flushScheduled.current = false;
          const nextValue = latestPayloadRef.current;
          if (!nextValue) return;
          onChange?.(nextValue);
          if (nextValue.editFeature && !fichaOpenRef.current) {
            setFichaOpen(true);
            openedFromInitialRef.current = true;
          }
        });
      }
    },
    [onChange]
  );

  const mode = onChange ? "editable" : "selected";

  const displayValue = (value as MapPickerValueLike) ?? {};
  const hasPerimetro = !!getEditFeature(displayValue);

  return (
    <div
      key={fieldKey}
      className="map-perimeter-field-embed rounded-2xl border border-border bg-card shadow-sm"
      style={{
        width: options?.width ?? "100%",
        height: options?.height ?? "min(420px, 55vh)",
        minHeight: "360px",
        maxHeight: "min(560px, 70vh)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div className="shrink-0 z-20 border-b border-border bg-card">
        <button
          type="button"
          id={`perimetro-ficha-toggle-${fieldKey}`}
          aria-expanded={fichaOpen}
          aria-controls={`perimetro-ficha-panel-${fieldKey}`}
          onClick={() => setFichaOpen((o) => !o)}
          className={
            "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 " +
            (fichaOpen ? "bg-accent/30" : "")
          }
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                Ficha do imóvel
              </span>
              {hasPerimetro ? (
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                  Perímetro definido
                </span>
              ) : (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                  Aguardando perímetro
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Perímetro para protocolo e dados derivados
            </p>
          </div>
          <FiChevronDown
            className={
              "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 " +
              (fichaOpen ? "rotate-180" : "")
            }
            aria-hidden
          />
        </button>
        {fichaOpen && (
          <div
            id={`perimetro-ficha-panel-${fieldKey}`}
            role="region"
            aria-labelledby={`perimetro-ficha-toggle-${fieldKey}`}
          >
            <FichaDropdownBody value={displayValue} />
          </div>
        )}
      </div>
      <div className="map-perimeter-field-embed-inner min-h-0 min-w-0 flex-1">
        <MapPicker
          mode={mode}
          layerConfig={MAP_PERIMETER_LAYER_CONFIG as any}
          onChange={handleChange}
          initialData={(value as MapPickerValueLike) ?? undefined}
          hideLayerManager={true}
        />
      </div>
    </div>
  );
};

