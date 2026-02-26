// this is necessary since leaflet is not server-side compatible
"use client"

import { useEffect, useRef, useState } from 'react';
import CaseDetails from '../CaseDetails';
import Map, { Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

function getCoordinates(caseItem) {
  const nestedCoords = caseItem?.address?.coordinates?.coordinates;

  if (Array.isArray(nestedCoords) && nestedCoords.length >= 2) {
    return [nestedCoords[0], nestedCoords[1]];
  }

  if (nestedCoords && typeof nestedCoords === "object") {
    const lng = nestedCoords.lng ?? nestedCoords.lon;
    const lat = nestedCoords.lat;

    if (typeof lng === "number" && typeof lat === "number") {
      return [lng, lat];
    }
  }

  const flatCoords = caseItem?.address?.coordinates;
  if (flatCoords && typeof flatCoords === "object") {
    const lng = flatCoords.lng ?? flatCoords.lon;
    const lat = flatCoords.lat;

    if (typeof lng === "number" && typeof lat === "number") {
      return [lng, lat];
    }
  }

  return null;
}

export default function CasesMap({ cases }) {
  const mapRef = useRef();

  const [selectedCases, setSelectedCases] = useState([]);

  useEffect(() => {
    window.scrollBy({ top: 70, behavior: 'smooth' });
  }, [selectedCases]);

  const geojson = {
    type: 'FeatureCollection',
    features: cases
      .map((c) => {
        const coordinates = getCoordinates(c);
        if (!coordinates) {
          return null;
        }

        return {
          type: 'Feature',
          properties: { ...c },
          geometry: {
            type: 'Point',
            coordinates,
          },
        };
      })
      .filter(Boolean),
  };

  const setCases = (event) => {
    const map = mapRef.current;
    const clusterSource = map.getSource('cases');
    const singlePoint = map.queryRenderedFeatures(event.point, { layers: ['unclustered-point'] });
    const clusters = map.queryRenderedFeatures(event.point, { layers: ['clusters'] });

    if (singlePoint.length) {
      const caseId = singlePoint[0].properties.id;
      const features = clusterSource._data.features.filter((f) => f.properties.id === caseId);
      setSelectedCases(features);
    } else if (clusters.length) {
      const clusterId = clusters[0].properties.cluster_id;
      const pointCount = clusters[0].properties.point_count;
      clusterSource.getClusterLeaves(clusterId, pointCount, 0, function(_err, aFeatures) {
        setSelectedCases(aFeatures);
      })
    }
  };

  return <div>
    <Map
      ref={mapRef}
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
      mapLib={import('mapbox-gl')}
      attributionControl={false}
      maxZoom={12}
      initialViewState={{
        longitude: 11,
        latitude: 52,
        zoom: 6
      }}
      style={{width: "100%", height: "calc(100vh - 400px)"}}
      mapStyle="mapbox://styles/jo5cha/clvqd5pkk01pg01qpa4t518pn"
      onClick={setCases}
    >
       <Source
          id="cases"
          type="geojson"
          data={geojson}
          cluster={true}
          clusterMaxZoom={14}
          clusterRadius={100}
        >
          <Layer
            id="clusters"
            type="circle"
            source="cases"
            filter={['has', 'point_count']}
            paint={{
              'circle-color': [
                'step',
                ['get', 'point_count'],
                'darkgrey', 5,
                'grey', 10,
                'black',
              ],
              'circle-radius': [
                'step',
                ['get', 'point_count'],
                20, 5,
                30, 10,
                40,
              ],
            }}
          />
          <Layer
            id="cluster-count"
            type="symbol"
            source="cases"
            filter={['has', 'point_count']}
            layout={{
              'text-field': '{point_count_abbreviated}',
              'text-size': 14,
            }}
            paint={{
              'text-color': 'white'
            }}
          />
          <Layer
            id="unclustered-point"
            type="circle"
            source="cases"
            filter={['!', ['has', 'point_count']]}
            paint={{
              'circle-color': 'darkgrey',
              'circle-radius': 10,
              'circle-stroke-width': 0
            }}
          />
        </Source>
    </Map>

    <div id="cases-list">
      {selectedCases.map((c) =>
        <div className='mt-4' key={c.properties.id}>
          <CaseDetails props={c.properties}></CaseDetails>
        </div>
      )}
    </div>
  </div>
}
