import React from 'react';
import { WMSTileLayer } from 'react-leaflet';

interface GeoSampaTileLayerProps {
  layerType: string;
}

export const GeoSampaTileLayer: React.FC<GeoSampaTileLayerProps> = ({ layerType }) => {
  return (
    <>
      <WMSTileLayer
        url="http://wms.geosampa.prefeitura.sp.gov.br/geoserver/geoportal/ows"
        layers="MALHA_MUNICIPAL_2024"
        format="image/png"
        opacity={0.5}
        transparent={true}
        maxNativeZoom={18}
        maxZoom={20}
        version="1.1.1"
      />
      {layerType === 'politico' && (
        <WMSTileLayer
          key='politico'
          url="http://wms.geosampa.prefeitura.sp.gov.br/geoserver/geoportal/ows"
          layers="geoportal:MapaBase_Politico"
          format="image/png"
          maxNativeZoom={18}
          maxZoom={20}
          transparent={true}
          version="1.1.1"
        />
      )}
      {layerType === 'topografico' && (
        <WMSTileLayer
          key='topografico'
          url="http://wms.geosampa.prefeitura.sp.gov.br/geoserver/geoportal/ows"
          layers="MapaBase_Topografico"
          format="image/png"
          maxNativeZoom={18}
          maxZoom={20}
          transparent={true}
          version="1.1.1"
        />
      )}
    </>
  );
};
