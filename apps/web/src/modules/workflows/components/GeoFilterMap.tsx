import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Rectangle,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { Button } from "@open-urbis/map-ui";
import { FaTimes, FaDrawPolygon, FaUndo } from "react-icons/fa";

export interface GeoBounds {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
}

interface GeoFilterMapProps {
  value?: GeoBounds;
  onChange: (bounds: GeoBounds | undefined) => void;
  onClose: () => void;
}

function BoundsDrawer({
  onBoundsDrawn,
  currentBounds,
}: {
  onBoundsDrawn: (bounds: GeoBounds) => void;
  currentBounds?: GeoBounds;
}) {
  const [firstCorner, setFirstCorner] = useState<L.LatLng | null>(null);
  const [previewBounds, setPreviewBounds] = useState<L.LatLngBounds | null>(
    null
  );

  useMapEvents({
    click(e) {
      if (!firstCorner) {
        setFirstCorner(e.latlng);
        setPreviewBounds(null);
      } else {
        const sw = L.latLng(
          Math.min(firstCorner.lat, e.latlng.lat),
          Math.min(firstCorner.lng, e.latlng.lng)
        );
        const ne = L.latLng(
          Math.max(firstCorner.lat, e.latlng.lat),
          Math.max(firstCorner.lng, e.latlng.lng)
        );

        onBoundsDrawn({
          swLat: sw.lat,
          swLng: sw.lng,
          neLat: ne.lat,
          neLng: ne.lng,
        });

        setFirstCorner(null);
        setPreviewBounds(null);
      }
    },
    mousemove(e) {
      if (firstCorner) {
        const sw = L.latLng(
          Math.min(firstCorner.lat, e.latlng.lat),
          Math.min(firstCorner.lng, e.latlng.lng)
        );
        const ne = L.latLng(
          Math.max(firstCorner.lat, e.latlng.lat),
          Math.max(firstCorner.lng, e.latlng.lng)
        );
        setPreviewBounds(L.latLngBounds(sw, ne));
      }
    },
  });

  const finalBounds = currentBounds
    ? L.latLngBounds(
        L.latLng(currentBounds.swLat, currentBounds.swLng),
        L.latLng(currentBounds.neLat, currentBounds.neLng)
      )
    : null;

  return (
    <>
      {previewBounds && (
        <Rectangle
          bounds={previewBounds}
          pathOptions={{
            color: "#3b82f6",
            weight: 2,
            dashArray: "6 4",
            fillOpacity: 0.1,
          }}
        />
      )}
      {finalBounds && (
        <Rectangle
          bounds={finalBounds}
          pathOptions={{
            color: "#2563eb",
            weight: 2,
            fillOpacity: 0.15,
            fillColor: "#3b82f6",
          }}
        />
      )}
      {firstCorner && (
        <Rectangle
          bounds={L.latLngBounds(firstCorner, firstCorner)}
          pathOptions={{ color: "#ef4444", weight: 3, fillOpacity: 0 }}
        />
      )}
    </>
  );
}

function FitBounds({ bounds }: { bounds?: GeoBounds }) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (bounds && !fitted.current) {
      map.fitBounds(
        L.latLngBounds(
          L.latLng(bounds.swLat, bounds.swLng),
          L.latLng(bounds.neLat, bounds.neLng)
        ),
        { padding: [30, 30] }
      );
      fitted.current = true;
    }
  }, [bounds, map]);

  return null;
}

export const GeoFilterMap: React.FC<GeoFilterMapProps> = ({
  value,
  onChange,
  onClose,
}) => {
  const [localBounds, setLocalBounds] = useState<GeoBounds | undefined>(value);

  const handleBoundsDrawn = useCallback((bounds: GeoBounds) => {
    setLocalBounds(bounds);
  }, []);

  const handleApply = () => {
    onChange(localBounds);
    onClose();
  };

  const handleClear = () => {
    setLocalBounds(undefined);
    onChange(undefined);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FaDrawPolygon size={14} className="text-primary" />
          <span className="text-sm font-medium text-foreground">
            Filtro Geoespacial
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-7 w-7"
        >
          <FaTimes size={12} />
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Clique dois pontos no mapa para definir a área de busca (bounding box).
      </p>

      <div className="rounded-lg overflow-hidden border border-border" style={{ height: 320 }}>
        <MapContainer
          center={[-23.55052, -46.633308]}
          zoom={11}
          style={{ width: "100%", height: "100%" }}
          zoomControl={true}
          attributionControl={false}
        >
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
          />
          <BoundsDrawer
            onBoundsDrawn={handleBoundsDrawn}
            currentBounds={localBounds}
          />
          <FitBounds bounds={value} />
        </MapContainer>
      </div>

      {localBounds && (
        <div className="text-xs text-muted-foreground bg-muted/30 rounded-md px-3 py-2 font-mono">
          SW: {localBounds.swLat.toFixed(5)}, {localBounds.swLng.toFixed(5)}
          {" → "}
          NE: {localBounds.neLat.toFixed(5)}, {localBounds.neLng.toFixed(5)}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={handleApply}
          disabled={!localBounds}
          className="h-8 px-4 text-xs"
        >
          Aplicar filtro
        </Button>
        {localBounds && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-8 px-3 text-xs gap-1.5 text-muted-foreground"
          >
            <FaUndo size={10} />
            Limpar área
          </Button>
        )}
      </div>
    </div>
  );
};
