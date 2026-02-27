"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { Protocol } from "pmtiles";
import { layers, namedFlavor } from "@protomaps/basemaps";
import "maplibre-gl/dist/maplibre-gl.css";
import CaseDetails from "../CaseDetails";

const PMTILES_PROTOCOL = "pmtiles";
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
let protocolRegistered = false;

function normalizeCoordinate(value, isLatitude) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numericValue = typeof value === "string" ? Number.parseFloat(value.replace(",", ".")) : Number(value);
  if (!Number.isFinite(numericValue)) {
    return null;
  }

  const maxAbs = isLatitude ? 90 : 180;
  if (Math.abs(numericValue) > maxAbs) {
    return null;
  }

  return numericValue;
}

function getCoordinates(caseItem) {
  const crime = Array.isArray(caseItem?.crime) ? caseItem.crime[0] : caseItem?.crime;
  const crimeGeolocationCoords = crime?.crime_geolocation?.coordinates;
  if (crimeGeolocationCoords && typeof crimeGeolocationCoords === "object") {
    const lng = normalizeCoordinate(crimeGeolocationCoords.lng ?? crimeGeolocationCoords.lon, false);
    const lat = normalizeCoordinate(crimeGeolocationCoords.lat, true);
    if (lng !== null && lat !== null) {
      return [lng, lat];
    }
  }

  const nestedCoords = caseItem?.address?.coordinates?.coordinates;
  if (Array.isArray(nestedCoords) && nestedCoords.length >= 2) {
    const lng = normalizeCoordinate(nestedCoords[0], false);
    const lat = normalizeCoordinate(nestedCoords[1], true);
    return lng !== null && lat !== null ? [lng, lat] : null;
  }

  if (nestedCoords && typeof nestedCoords === "object") {
    const lng = normalizeCoordinate(nestedCoords.lng ?? nestedCoords.lon, false);
    const lat = normalizeCoordinate(nestedCoords.lat, true);
    return lng !== null && lat !== null ? [lng, lat] : null;
  }

  const flatCoords = caseItem?.address?.coordinates;
  if (flatCoords && typeof flatCoords === "object") {
    const lng = normalizeCoordinate(flatCoords.lng ?? flatCoords.lon, false);
    const lat = normalizeCoordinate(flatCoords.lat, true);
    return lng !== null && lat !== null ? [lng, lat] : null;
  }

  return null;
}

function sortCasesByDateDesc(caseList) {
  return [...caseList].sort((a, b) => {
    const dateA = Date.parse(a?.crime_date || "");
    const dateB = Date.parse(b?.crime_date || "");
    if (!Number.isFinite(dateA) && !Number.isFinite(dateB)) return 0;
    if (!Number.isFinite(dateA)) return 1;
    if (!Number.isFinite(dateB)) return -1;
    return dateB - dateA;
  });
}

export default function CasesMap({
  cases = [],
  language = "de",
  height = "70vh",
  pmtilesUrl = "/germany9.pmtiles",
}) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const geojsonRef = useRef({ type: "FeatureCollection", features: [] });
  const casesByIdRef = useRef(new Map());
  const languageRef = useRef(language);
  const [selectedCases, setSelectedCases] = useState([]);
  const [panelTitle, setPanelTitle] = useState("");
  const [mapLoaded, setMapLoaded] = useState(false);

  const casesWithCoordinates = useMemo(() => {
    return cases
      .map((caseItem) => ({ caseItem, coordinates: getCoordinates(caseItem) }))
      .filter(({ coordinates }) => Array.isArray(coordinates));
  }, [cases]);

  const casesById = useMemo(() => {
    const index = new Map();
    for (const { caseItem } of casesWithCoordinates) {
      index.set(String(caseItem.id), caseItem);
    }
    return index;
  }, [casesWithCoordinates]);

  const geojsonData = useMemo(
    () => ({
      type: "FeatureCollection",
      features: casesWithCoordinates.map(({ caseItem, coordinates }) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates,
        },
        properties: {
          id: String(caseItem.id),
          crime_date: caseItem.crime_date || "",
          city: caseItem?.address?.city || "",
        },
      })),
    }),
    [casesWithCoordinates]
  );

  useEffect(() => {
    geojsonRef.current = geojsonData;
  }, [geojsonData]);

  useEffect(() => {
    casesByIdRef.current = casesById;
  }, [casesById]);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  useEffect(() => {
    if (map.current || !mapContainer.current) {
      return;
    }

    if (!protocolRegistered) {
      const protocol = new Protocol();
      maplibregl.addProtocol(PMTILES_PROTOCOL, protocol.tile);
      protocolRegistered = true;
    }

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      zoom: 5,
      minZoom: 2,
      maxZoom: 12,
      center: [10.5, 51.3],
      maxBounds: [[2.0, 47.0], [18.0, 55.0]],
      style: {
        version: 8,
        glyphs: "https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf",
        sources: {
          protomaps: {
            type: "vector",
            url: `${PMTILES_PROTOCOL}://${BASE_PATH}${pmtilesUrl}`,
            attribution: "© OpenStreetMap",
          },
        },
        layers: layers("protomaps", namedFlavor("grayscale"), { lang: languageRef.current }),
      },
    });

    map.current.addControl(new maplibregl.NavigationControl(), "top-right");
    map.current.doubleClickZoom.disable();

    map.current.on("load", () => {
      setMapLoaded(true);

      map.current.addSource("cases", {
        type: "geojson",
        data: geojsonRef.current,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      map.current.addLayer({
        id: "clusters",
        type: "circle",
        source: "cases",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": ["step", ["get", "point_count"], "#384B70", 10, "#2F4060", 20, "#263550", 50, "#1D2A40"],
          "circle-radius": ["step", ["get", "point_count"], 14, 10, 20, 20, 26, 50, 32],
          "circle-opacity": ["step", ["get", "point_count"], 0.8, 10, 0.9, 20, 0.9, 50, 1],
          "circle-stroke-width": 1,
          "circle-stroke-color": "#5A6D8A",
        },
      });

      map.current.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "cases",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-font": ["Noto Sans Medium"],
          "text-size": 12,
          "text-allow-overlap": true,
          "text-ignore-placement": true,
        },
        paint: {
          "text-color": "#ffffff",
        },
      });

      map.current.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "cases",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": "#384B70",
          "circle-radius": 6,
          "circle-stroke-width": 1,
          "circle-stroke-color": "#5A6D8A",
        },
      });

      map.current.on("click", "clusters", async (e) => {
        const features = map.current.queryRenderedFeatures(e.point, { layers: ["clusters"] });
        const clusterFeature = features[0];
        if (!clusterFeature?.properties) {
          return;
        }

        const clusterId = clusterFeature.properties.cluster_id;
        const pointCount = clusterFeature.properties.point_count;
        const source = map.current.getSource("cases");
        if (!source || typeof source.getClusterLeaves !== "function") {
          return;
        }

        try {
          const leaves = await source.getClusterLeaves(clusterId, pointCount, 0);
          const selected = sortCasesByDateDesc(
            leaves.map((leaf) => casesByIdRef.current.get(String(leaf?.properties?.id))).filter(Boolean)
          );

          setSelectedCases(selected);
          setPanelTitle(
            languageRef.current === "de" ? `${selected.length} Faelle angeklickt` : `${selected.length} cases clicked`
          );
        } catch (error) {
          console.error("Error getting cluster leaves:", error);
        }
      });

      map.current.on("click", "unclustered-point", (e) => {
        const selectedId = e.features?.[0]?.properties?.id;
        if (!selectedId) {
          return;
        }

        const selected = casesByIdRef.current.get(String(selectedId));
        if (!selected) {
          return;
        }

        setSelectedCases([selected]);
        setPanelTitle(languageRef.current === "de" ? "1 Fall angeklickt" : "1 case clicked");
      });

      map.current.on("click", (e) => {
        const clusters = map.current.queryRenderedFeatures(e.point, { layers: ["clusters"] });
        const points = map.current.queryRenderedFeatures(e.point, { layers: ["unclustered-point"] });
        if (clusters.length === 0 && points.length === 0) {
          setSelectedCases([]);
          setPanelTitle("");
        }
      });

      map.current.on("mouseenter", "clusters", () => {
        map.current.getCanvas().style.cursor = "pointer";
      });
      map.current.on("mouseleave", "clusters", () => {
        map.current.getCanvas().style.cursor = "";
      });
      map.current.on("mouseenter", "unclustered-point", () => {
        map.current.getCanvas().style.cursor = "pointer";
      });
      map.current.on("mouseleave", "unclustered-point", () => {
        map.current.getCanvas().style.cursor = "";
      });
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      setMapLoaded(false);
    };
  }, [pmtilesUrl]);

  useEffect(() => {
    if (!map.current || !mapLoaded || !map.current.getSource("cases")) {
      return;
    }

    const source = map.current.getSource("cases");
    if (!source || typeof source.setData !== "function") {
      return;
    }

    source.setData(geojsonData);
    setSelectedCases([]);
    setPanelTitle("");
  }, [geojsonData, mapLoaded]);

  return (
    <div className="cases-map-layout" style={{ "--cases-panel-height": height }}>
      <div className="cases-map-shell">
        <div ref={mapContainer} className="cases-map-canvas" />
      </div>

      <aside className="cases-list-panel">
        <div className="cases-list-header">
          <div>
            <p className="cases-list-kicker">{language === "de" ? "Auswahl" : "Selection"}</p>
            <h2 className="cases-list-title">
              {selectedCases.length > 0 ? panelTitle : language === "de" ? "Noch keine Auswahl" : "No selection yet"}
            </h2>
          </div>
          {selectedCases.length > 0 && (
            <button
              type="button"
              className="cases-list-close"
              onClick={() => {
                setSelectedCases([]);
                setPanelTitle("");
              }}
            >
              {language === "de" ? "Schliessen" : "Close"}
            </button>
          )}
        </div>

        {selectedCases.length > 0 ? (
          <div className="cases-list-scroll">
            {selectedCases.map((caseItem) => (
              <CaseDetails key={caseItem.id} props={caseItem} />
            ))}
          </div>
        ) : (
          <p className="cases-list-empty">
            {language === "de"
              ? "Klicke auf einen Marker oder Cluster, um Fallinformationen anzuzeigen."
              : "Click a marker or cluster to show case details."}
          </p>
        )}
      </aside>
    </div>
  );
}
