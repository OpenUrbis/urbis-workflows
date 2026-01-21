import {
  MapContainer,
  Polygon,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { useState, useEffect, useContext, useRef } from "react";
import { MdCenterFocusStrong } from "react-icons/md";
import { MapUpdater, convertCoordinates, findCenter } from "../../../../utils";
import { MapScrollManager } from "../../components/MapScrollManager";
import { MapOptions as BaseMapOptions } from "@open-urbis/types";
import { LayerDescriptor } from "../../../../api/types/schema";
import { StyleContext } from "../../../../reducers/style.reducer";
import { Tooltip } from "@chakra-ui/react";
import L from "leaflet";
import React from "react";

interface Geometry {
  title: string;
  color: string;
  properties: {
    label: string;
    key: string;
    value?: string;
    includeOnPopUp: boolean;
  }[];
  coordinates: [number, number][];
}

// Update the MapOptions interface - remove showInfoMarkers since we don't need it anymore
interface MapOptions extends BaseMapOptions {
  // No longer need showInfoMarkers option
}

export type FieldMapProps = {
  fieldKey: string;
  options: MapOptions;
  value?: {
    geometries: Geometry[];
  };
};

export const Map: React.FC<FieldMapProps> = ({ fieldKey, options, value }) => {
  const [geometries, setGeometries] = useState<Geometry[]>([]);
  const [bounds, setBounds] = useState<[number, number][]>([]);
  const [position, setPosition] = useState({
    lat: -23.55052,
    lng: -46.633308,
  });
  const [zoom, setZoom] = useState(10);
  const styleContext = useContext(StyleContext);

  // Create a ref to store polygon centers for click detection
  const polygonCentersRef = useRef<
    { id: string; center: [number, number]; geometry: Geometry }[]
  >([]);
  const mapRef = useRef<L.Map | null>(null);

  // Map reference setter callback (defined once to avoid recreating it on each render)
  const setMapRefCallback = React.useCallback((map: L.Map) => {
    mapRef.current = map;
  }, []);

  useEffect(() => {
    if (value !== undefined) {
      let geometries: Geometry[] = [];

      if (value.geometries && value.geometries.length > 0) {
        geometries = value.geometries.map((geom) => {
          return {
            ...geom,
            coordinates: convertCoordinates(geom.coordinates ?? []).map(
              (coord) => [coord.lat, coord.lng]
            ),
          };
        });
      } else if (options.layers && options.layers.length > 0) {
        geometries = options.layers
          .map((layer) => {
            return extractLayers(value, layer);
          })
          .flat();
      }

      if (geometries.length > 0) {
        const position = findCenter(
          geometries[0].coordinates.map((coord) => ({
            lat: coord[0],
            lng: coord[1],
          }))
        );

        setGeometries(geometries);
        setPosition(position);
        setZoom(19);
        setTimeout(() => setBounds(geometries[0].coordinates), 100);
      }
    }
  }, [value, options.layers]);

  useEffect(() => {
    // Update polygon centers when geometries change
    if (geometries.length > 0) {
      const centers = geometries.map((geom, index) => {
        const center = findCenter(
          geom.coordinates.map((coord) => ({ lat: coord[0], lng: coord[1] }))
        );

        return {
          id: `polygon-${index}`,
          center: [center.lat, center.lng] as [number, number],
          geometry: geom,
        };
      });

      polygonCentersRef.current = centers;
    }
  }, [geometries]);

  // Fix Leaflet's default icon issue (keep this for any potential Leaflet markers)
  const DefaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  L.Marker.prototype.options.icon = DefaultIcon;

  // Add custom CSS to ensure popups are visible
  useEffect(() => {
    // Add CSS to make sure our popups are visible
    const style = document.createElement("style");
    style.innerHTML = `
      .leaflet-popup {
        z-index: 1001 !important;
      }
      .map-property-label {
        display: inline-block;
        width: 100%;
        margin-bottom: 2px;
      }
      .map-property-value {
        display: inline-block;
        padding-left: 0;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Helper to find the closest polygon to a click point
  const findClosestPolygon = (
    clickLat: number,
    clickLng: number
  ): { id: string; center: [number, number]; geometry: Geometry } | null => {
    const centers = polygonCentersRef.current;
    if (!centers || centers.length === 0) return null;

    let closestPolygon = null;
    let closestDistance = Infinity;

    centers.forEach((polygon) => {
      const [centerLat, centerLng] = polygon.center;
      // Calculate distance using simplified approach
      const dLat = clickLat - centerLat;
      const dLng = clickLng - centerLng;
      const distance = Math.sqrt(dLat * dLat + dLng * dLng);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestPolygon = polygon;
      }
    });

    // Only return if polygon is somewhat close (arbitrary threshold)
    return closestDistance < 0.01 ? closestPolygon : null;
  };

  // Handle map click to find and open closest polygon popup
  const handleMapClick = (latlng: L.LatLng): void => {
    const { lat, lng } = latlng;

    // Find the closest polygon and create a popup manually
    const closestPolygon = findClosestPolygon(lat, lng);
    if (closestPolygon && mapRef.current) {
      const { geometry, center } = closestPolygon;

      // Create and open a popup at the center position
      L.popup()
        .setLatLng({ lat: center[0], lng: center[1] })
        .setContent(
          `
          <div class="min-w-[220px] max-w-[300px]">
            <div class="flex items-center space-x-2 mb-3 border-b pb-2">
              <div class="w-4 h-4 rounded-full flex-shrink-0" style="background-color: ${geometry.color}"></div>
              <div class="font-bold text-lg">${geometry.title}</div>
            </div>
            <div class="space-y-3">
              ${geometry.properties
                .filter((prop) => prop.includeOnPopUp)
                .map(
                  (prop) => `
                  <div class="mb-2">
                    <div class="font-semibold text-sm map-property-label">${prop.label}:</div>
                    <div class="map-property-value">
                      ${prop.value || '<span class="italic text-gray-500">Não informado</span>'}
                    </div>
                  </div>
                `
                )
                .join("")}
            </div>
          </div>
        `
        )
        .openOn(mapRef.current);
    }
  };

  return (
    <>
      <MapContainer
        key={fieldKey}
        style={{
          width: options.width ?? "100%",
          height: options.height ?? "400px",
          borderRadius: "1rem",
          background: "#ffffff",
          zIndex: 0,
        }}
        center={position}
        zoomControl={!(options.zoomControl === false)}
        attributionControl={false}
        maxZoom={19}
        zoom={zoom}
      >
        {/* <GeoSampaTileLayer layerType={layerType} /> */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
          maxZoom={19}
        />
        <SetViewToBounds bounds={bounds ?? []}></SetViewToBounds>
        <MapEventHandler
          onMapClick={handleMapClick}
          setMapRef={setMapRefCallback}
        />
        {geometries?.map((geom: Geometry, index: number) => (
          <div key={`polygon-container-${index}`}>
            <Polygon
              key={`polygon-${index}`}
              positions={geom.coordinates ?? []}
              color={geom.color}
            >
              <Popup>
                <div className="min-w-[220px] max-w-[300px]">
                  <div className="flex items-center space-x-2 mb-3 border-b pb-2">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: geom.color }}
                    ></div>
                    <div className="font-bold text-lg">{geom.title}</div>
                  </div>
                  <div className="space-y-3">
                    {geom.properties
                      .filter((prop) => prop.includeOnPopUp)
                      .map((prop) => (
                        <div key={`popup-${prop.key}`} className="mb-2">
                          <div className="font-semibold text-sm map-property-label">
                            {prop.label}:
                          </div>
                          <div className="map-property-value">
                            {prop.value || (
                              <span className="italic text-gray-500">
                                Não informado
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </Popup>
            </Polygon>
            {/* InfoMarker component has been removed */}
          </div>
        ))}
        <MapUpdater center={position} zoom={zoom} />
        <MapScrollManager />
      </MapContainer>
      {options.table !== false &&
        Array.isArray(geometries) &&
        geometries.length > 0 && (
          <div
            className={`flex flex-col space-y-4 mt-4 rounded-lg transition-colors duration-150 ${
              styleContext.state.buttonHoverColorWeight === "200"
                ? "border border-gray-200 bg-gray-50"
                : "border border-gray-600 bg-gray-800/20"
            }`}
          >
            <div
              className={`p-3 rounded-t-lg transition-colors duration-150 ${
                styleContext.state.buttonHoverColorWeight === "200"
                  ? "bg-gray-100 border-b border-gray-200"
                  : "bg-gray-700/40 border-b border-gray-600"
              }`}
            >
              <h3
                className="text-base font-semibold"
                style={{ color: styleContext.state.textColor }}
              >
                Detalhes da Área
              </h3>
            </div>

            <div className="px-4 pb-4 space-y-4">
              {geometries?.map((geom, index) => (
                <div
                  key={`geom-${index}`}
                  className={`flex flex-col space-y-3 p-4 rounded-lg transition-colors duration-150 ${
                    styleContext.state.buttonHoverColorWeight === "200"
                      ? "border border-gray-200 bg-white"
                      : "border border-gray-600 bg-gray-800/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-4 h-4 rounded-full flex-shrink-0`}
                        style={{ backgroundColor: geom.color }}
                      ></div>
                      <h2
                        className="font-medium"
                        style={{ color: styleContext.state.textColor }}
                      >
                        {geom.title}
                      </h2>
                    </div>
                    <Tooltip
                      label="Centralizar esta área no mapa"
                      placement="top"
                      hasArrow
                    >
                      <button
                        onClick={() => {
                          setBounds([]);
                          setTimeout(() => setBounds(geom.coordinates), 0);
                        }}
                        className={`flex items-center space-x-1 text-sm transition-colors ${
                          styleContext.state.buttonHoverColorWeight === "200"
                            ? "text-gray-600 hover:text-gray-800"
                            : "text-gray-300 hover:text-white"
                        }`}
                        title="Centralizar no mapa"
                      >
                        <MdCenterFocusStrong size={16} />
                        <span>Centralizar</span>
                      </button>
                    </Tooltip>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6 mt-1">
                    {geom.properties.map((prop, propIndex) => (
                      <div
                        key={`prop-${prop.key}-${propIndex}`}
                        className="flex flex-col"
                      >
                        <span
                          className={`text-xs ${
                            styleContext.state.buttonHoverColorWeight === "200"
                              ? "text-gray-500"
                              : "text-gray-400"
                          }`}
                        >
                          {prop.label}
                        </span>
                        <span
                          className="font-medium"
                          style={{ color: styleContext.state.textColor }}
                        >
                          {prop.value || (
                            <span
                              className={
                                styleContext.state.buttonHoverColorWeight ===
                                "200"
                                  ? "text-gray-400 italic"
                                  : "text-gray-500 italic"
                              }
                            >
                              Não informado
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
    </>
  );
};

// Component to handle map events and map reference
interface MapEventHandlerProps {
  onMapClick: (latlng: L.LatLng) => void;
  setMapRef: (map: L.Map) => void;
}

const MapEventHandler: React.FC<MapEventHandlerProps> = ({
  onMapClick,
  setMapRef,
}) => {
  const map = useMapEvents({
    click: (e) => {
      onMapClick(e.latlng);
    },
  });

  // Store the map reference
  useEffect(() => {
    if (map) {
      setMapRef(map);
    }
  }, [map, setMapRef]);

  return null;
};

// InfoMarker component has been removed completely

const SetViewToBounds = ({ bounds }: { bounds: [number, number][] }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds.length > 0) {
      map.fitBounds(bounds, {
        padding: [15, 15],
        maxZoom: 20,
      });
    }
  }, [bounds, map]);

  return null;
};

function extractLayers(value: any, layer: LayerDescriptor): Geometry[] {
  try {
    const data =
      layer.key !== "geom_lote"
        ? value?.[layer.key]
        : [{ geometry: value?.[layer.key] }];

    const layers =
      data
        ?.filter((feature: any) => feature?.geometry?.type === "Polygon")
        ?.map((feature: any) => {
          const properties = layer.properties.map((prop) => {
            return {
              ...prop,
              value: feature.properties[prop.key],
            };
          });

          return {
            color: layer.color,
            coordinates: convertCoordinates(
              Array.isArray(feature.geometry.coordinates[0])
                ? feature.geometry.coordinates[0]
                : feature.geometry.coordinates
            ).map((coord) => [coord.lat, coord.lng]),
            properties,
            title: layer.title,
          };
        }) ?? [];

    const layersMultiPolygon =
      data
        ?.filter((feature: any) => feature?.geometry?.type === "MultiPolygon")
        ?.map((feature: any) => {
          const properties = layer.properties.map((prop) => {
            return {
              ...prop,
              value: feature.properties[prop.key],
            };
          });

          return {
            color: layer.color,
            coordinates: feature.geometry.coordinates[0]
              .map((coord: any[]) =>
                convertCoordinates(coord).map((coord) => [coord.lat, coord.lng])
              )
              .flat(),
            properties,
            title: layer.title,
          };
        }) ?? [];

    return [...layers, ...layersMultiPolygon];
  } catch (e) {
    return [];
  }
}
