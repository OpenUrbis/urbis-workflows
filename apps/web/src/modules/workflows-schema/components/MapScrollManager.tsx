import { useMap, useMapEvent } from "react-leaflet";
import { useEffect } from "react";

/**
 * MapScrollManager component to manage scroll zoom behavior on a map.
 * Disables scroll zoom initially and enables it when the map is clicked.
 * Disables scroll zoom when clicking outside the map.
 * 
 * @returns {null} This component does not render any elements.
 */
export const MapScrollManager: React.FC = () => {
  const map = useMap();

  // Disable scroll zoom initially
  useEffect(() => {
    map.scrollWheelZoom.disable();
  }, [map]);

  // Enable scroll zoom when clicking on the map
  useMapEvent('click', () => {
    map.scrollWheelZoom.enable();
  });

  // Disable scroll zoom when clicking outside the map
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | any) => {
      if (!event.target.closest('.leaflet-container')) {
        map.scrollWheelZoom.disable();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [map]);

  return null;
};
