"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { Protocol } from "pmtiles";
import { layers, namedFlavor } from "@protomaps/basemaps";
import "maplibre-gl/dist/maplibre-gl.css";
import CaseList, { LIST_PAGE_SIZE } from "./CaseList";
import { getAllCases } from "../../services/api";
import { getMonth, getMonthBounds, getStateCode, isFullRange, rangeLabel, statesLabel } from "./filterUtils";

let protocolRegistered = false;

const NO_SELECTION_FILTER = ["==", ["get", "id"], "__none__"];

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
  const coords = caseItem?.crime?.crime_coordinates;
  if (!coords) {
    return null;
  }

  const lng = normalizeCoordinate(coords.lng, false);
  const lat = normalizeCoordinate(coords.lat, true);
  return lng !== null && lat !== null ? [lng, lat] : null;
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
  language = "de",
  pmtilesUrl = "/germany9.pmtiles",
}) {
  const [cases, setCases] = useState([]);
  const [status, setStatus] = useState("loading");
  const mapContainer = useRef(null);
  const map = useRef(null);
  const geojsonRef = useRef({ type: "FeatureCollection", features: [] });
  const casesByIdRef = useRef(new Map());
  const languageRef = useRef(language);
  // { cases, filter } of the clicked cluster/point (filter drives the map highlight); null = no selection
  const [selection, setSelection] = useState(null);
  const [listLimit, setListLimit] = useState(LIST_PAGE_SIZE);
  const [mapLoaded, setMapLoaded] = useState(false);
  // null = full data range; otherwise [fromMonth, toMonth] (absolute month indices, inclusive)
  const [range, setRange] = useState(null);
  // selected Bundesland codes; empty = all
  const [states, setStates] = useState([]);

  useEffect(() => {
    let cancelled = false;

    getAllCases()
      .then(({ data }) => {
        if (cancelled) return;
        setCases(data ?? []);
        setStatus("ready");
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Error loading cases:", error);
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Only cases with coordinates can be shown on the map, so they form the base for list and filters.
  const entries = useMemo(() => {
    return cases
      .map((caseItem) => ({
        caseItem,
        coordinates: getCoordinates(caseItem),
        month: getMonth(caseItem),
        state: getStateCode(caseItem),
      }))
      .filter(({ coordinates }) => Array.isArray(coordinates));
  }, [cases]);

  const bounds = useMemo(() => getMonthBounds(entries.map(({ month }) => month)), [entries]);
  const from = bounds ? Math.max(bounds.min, range?.[0] ?? bounds.min) : 0;
  const to = bounds ? Math.min(bounds.max, range?.[1] ?? bounds.max) : 0;
  const fullRange = isFullRange(from, to, bounds);

  // Cases without a valid date are only shown while the date range is full.
  const matchesDate = useCallback(
    ({ month }) => fullRange || (month !== null && month >= from && month <= to),
    [fullRange, from, to]
  );
  const matchesStates = useCallback(
    ({ state }) => states.length === 0 || (state !== null && states.includes(state)),
    [states]
  );

  const filteredEntries = useMemo(
    () => entries.filter((entry) => matchesDate(entry) && matchesStates(entry)),
    [entries, matchesDate, matchesStates]
  );

  const filteredCases = useMemo(
    () => sortCasesByDateDesc(filteredEntries.map(({ caseItem }) => caseItem)),
    [filteredEntries]
  );

  // Bundesland counts respect the date filter only, month counts the Bundesland filter only.
  const stateCounts = useMemo(() => {
    const counts = {};
    for (const entry of entries) {
      if (entry.state && matchesDate(entry)) {
        counts[entry.state] = (counts[entry.state] ?? 0) + 1;
      }
    }
    return counts;
  }, [entries, matchesDate]);

  const monthCounts = useMemo(() => {
    if (!bounds) return [];
    const counts = new Array(bounds.max - bounds.min + 1).fill(0);
    for (const entry of entries) {
      if (entry.month !== null && matchesStates(entry)) {
        counts[entry.month - bounds.min] += 1;
      }
    }
    return counts;
  }, [entries, bounds, matchesStates]);

  const activeCount = (fullRange ? 0 : 1) + (states.length > 0 ? 1 : 0);

  const casesById = useMemo(() => {
    const index = new Map();
    for (const { caseItem } of filteredEntries) {
      index.set(String(caseItem.uuid), caseItem);
    }
    return index;
  }, [filteredEntries]);

  const geojsonData = useMemo(
    () => ({
      type: "FeatureCollection",
      features: filteredEntries.map(({ caseItem, coordinates }) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates,
        },
        properties: {
          id: String(caseItem.uuid),
          crime_date: caseItem.crime_date || "",
          city: caseItem?.crime?.crime_city || "",
        },
      })),
    }),
    [filteredEntries]
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
      maplibregl.addProtocol('pmtiles', protocol.tile);
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
        glyphs: '/basemaps-assets-main/fonts/{fontstack}/{range}.pbf',
        sources: {
          protomaps: {
            type: "vector",
            url: `pmtiles://${pmtilesUrl}`,
            attribution: '© OpenStreetMap',
          },
        },
        layers: layers("protomaps", namedFlavor("grayscale"), { lang: languageRef.current }),
      },
    });

    map.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
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

      // White gap + ink ring around the selected cluster/point, drawn below it.
      map.current.addLayer({
        id: "selection-ring",
        type: "circle",
        source: "cases",
        filter: NO_SELECTION_FILTER,
        paint: {
          "circle-color": "#ffffff",
          "circle-radius": ["case", ["has", "point_count"], ["step", ["get", "point_count"], 17, 10, 23, 20, 29, 50, 35], 9],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#172033",
        },
      });

      map.current.addLayer({
        id: "clusters",
        type: "circle",
        source: "cases",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": ["step", ["get", "point_count"], "#A541B0", 10, "#A541B0", 20, "#A541B0", 50, "#A541B0"],
          "circle-radius": ["step", ["get", "point_count"], 14, 10, 20, 20, 26, 50, 32],
          "circle-opacity": 1
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
          "text-size": ["step", ["get", "point_count"], 12, 10, 14, 20, 16, 50, 18],
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
          "circle-color": "#A541B0",
          "circle-radius": 6,
          "circle-stroke-width": 1,
          "circle-stroke-color": "transparent",
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

          setSelection({
            cases: selected,
            filter: ["all", ["has", "point_count"], ["==", ["get", "cluster_id"], clusterId]],
          });
          setListLimit(LIST_PAGE_SIZE);
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

        setSelection({
          cases: [selected],
          filter: ["all", ["!", ["has", "point_count"]], ["==", ["get", "id"], String(selectedId)]],
        });
        setListLimit(LIST_PAGE_SIZE);
      });

      map.current.on("click", (e) => {
        const clusters = map.current.queryRenderedFeatures(e.point, { layers: ["clusters"] });
        const points = map.current.queryRenderedFeatures(e.point, { layers: ["unclustered-point"] });
        if (clusters.length === 0 && points.length === 0) {
          setSelection(null);
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
  }, [geojsonData, mapLoaded]);

  useEffect(() => {
    if (!map.current || !mapLoaded || !map.current.getLayer("selection-ring")) {
      return;
    }
    map.current.setFilter("selection-ring", selection?.filter ?? NO_SELECTION_FILTER);
  }, [selection, mapLoaded]);

  // Changing any filter clears the cluster selection and resets the list pagination.
  useEffect(() => {
    setSelection(null);
    setListLimit(LIST_PAGE_SIZE);
  }, [filteredEntries]);

  const resetFilters = useCallback(() => {
    setRange(null);
    setStates([]);
  }, []);

  return (
    <div className="cases-map-layout">
      <div className="cases-map-shell">
        <div ref={mapContainer} className="cases-map-canvas" />
      </div>

      <aside className="cases-list-panel">
        <CaseList
          status={status}
          filteredCases={filteredCases}
          selection={selection?.cases ?? null}
          activeCount={activeCount}
          summary={`${rangeLabel(from, to, bounds)} · ${statesLabel(states)}`}
          limit={listLimit}
          onMore={() => setListLimit((limit) => limit + LIST_PAGE_SIZE)}
          onClearSelection={() => setSelection(null)}
          onReset={resetFilters}
        />
      </aside>
    </div>
  );
}
