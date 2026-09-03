import { IFormContext } from "@open-urbis/types";
import proj4 from "proj4";
import { useEffect } from "react";
import { useMap } from "react-leaflet";

// Map utilities
export function convertCoordinates(
  coordinates: [number, number][]
): { lat: number; lng: number }[] {
  const WGS84 = "EPSG:4326";
  const epsg31983 = import.meta.env.VITE_PROJECTION_CONFIG || "+proj=utm +zone=23 +south +units=m +no_defs";

  return coordinates.map((coordinate: any) => {
    const coord = proj4(epsg31983, WGS84, coordinate);
    return {
      lat: coord[1],
      lng: coord[0],
    };

    // If no projection is needed, just map the coordinates directly
    return {
      lat: coordinate[1],
      lng: coordinate[0],
    };
  });
}

export function findCenter(coordinates: { lat: number; lng: number }[]): {
  lat: number;
  lng: number;
} {
  let sumLat = 0;
  let sumLng = 0;

  coordinates.forEach((coord) => {
    sumLat += coord.lat;
    sumLng += coord.lng;
  });

  const center = {
    lat: sumLat / coordinates.length,
    lng: sumLng / coordinates.length,
  };

  return center;
}

export function MapUpdater({
  center,
  zoom,
}: {
  center: { lat: number; lng: number };
  zoom: number;
}): null {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);

  return null;
}

export function parseAndExecuteTaxExpr(
  functionString: string,
  context: any,
  general: IFormContext
): any {
  try {
    const functionBody = functionString.match(
      /function\s+tax\(([^)]*)\)\s*{([\s\S]*)}/
    );

    if (!functionBody) {
      throw new Error("Function definition not found in the given string.");
    }

    const params = functionBody[1];
    const body = functionBody[2];

    // eslint-disable-next-line no-new-func
    const fun = new Function(params, body);

    return fun(context, general);
  } catch (e) {
    return String(e);
  }
}
