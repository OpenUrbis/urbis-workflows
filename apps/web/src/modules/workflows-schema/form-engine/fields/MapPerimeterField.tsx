import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

const FichaDoImovel = ({
  value,
  onClose,
}: {
  value: MapPickerValueLike;
  onClose: () => void;
}) => {
  const resumo = useMemo(() => {
    const editFeature = value?.editFeature;
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
    <div className="absolute inset-0 bg-background/95 backdrop-blur pointer-events-auto z-50">
      <div className="flex flex-col h-full w-full">
        <div className="p-4 border-b flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold">Ficha do imóvel</h3>
            <p className="text-sm text-muted-foreground">
              Perímetro para protocolo e dados derivados
            </p>
          </div>
          <button
            type="button"
            className="px-3 py-1.5 rounded-lg border hover:bg-accent/50 transition-colors text-sm"
            onClick={onClose}
          >
            Fechar
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="mb-4 rounded-lg border p-3 bg-card">
            <div className="text-xs font-semibold mb-2 text-muted-foreground">
              Resumo
            </div>
            <pre className="text-xs font-mono whitespace-pre-wrap break-words">
              {JSON.stringify(resumo, null, 2)}
            </pre>
          </div>

          <div className="rounded-lg border p-3 bg-card">
            <div className="text-xs font-semibold mb-2 text-muted-foreground">
              Payload (editFeature + interseções)
            </div>
            <pre className="text-xs font-mono whitespace-pre-wrap break-words">
              {JSON.stringify(
                {
                  editFeature: value?.editFeature ?? null,
                  intersections: value?.intersections ?? null,
                },
                null,
                2
              )}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

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
  const [showFicha, setShowFicha] = useState(false);
  const openedFromInitialRef = useRef(false);
  const showFichaRef = useRef(showFicha);
  showFichaRef.current = showFicha;
  const flushScheduled = useRef(false);
  const latestPayloadRef = useRef<MapPickerValueLike | null>(null);

  const initialEditFeature = useMemo(() => getEditFeature(value), [value]);

  useEffect(() => {
    // Abrir automaticamente quando o componente for instanciado com editFeature já presente.
    if (openedFromInitialRef.current) return;
    if (initialEditFeature) {
      setShowFicha(true);
      openedFromInitialRef.current = true;
    }
  }, [initialEditFeature]);

  useEffect(() => {
    // Se o component for montado com um novo fieldKey (re-instancia), reinicia a regra.
    openedFromInitialRef.current = false;
    setShowFicha(!!initialEditFeature);
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
          if (nextValue.editFeature && !showFichaRef.current) {
            setShowFicha(true);
            openedFromInitialRef.current = true;
          }
        });
      }
    },
    [onChange]
  );

  const mode = onChange ? "editable" : "selected";

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
      <div className="map-perimeter-field-embed-inner min-h-0 min-w-0 flex-1">
        <MapPicker
          mode={mode}
          layerConfig={MAP_PERIMETER_LAYER_CONFIG as any}
          onChange={handleChange}
          initialData={(value as MapPickerValueLike) ?? undefined}
          overlay={showFicha ? <FichaDoImovel value={value as any} onClose={() => setShowFicha(false)} /> : undefined}
          hideMap={showFicha}
          hideLayerManager={true}
        />
      </div>
    </div>
  );
};

