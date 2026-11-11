"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import maplibregl from "maplibre-gl";
import { Protocol } from "pmtiles";
import { layers, namedFlavor } from "@protomaps/basemaps";
import "maplibre-gl/dist/maplibre-gl.css";
import CaseList, { LIST_PAGE_SIZE } from "./CaseList";
import FilterPanel from "./FilterPanel";
import { FunnelIcon, ResetViewIcon } from "./MapIcons";
import { MobileFilterBar, MobileFilterSheet } from "./MobileFilters";
import useMediaQuery from "./useMediaQuery";
import { getCases } from "../../services/api";
import {
  GENDER_OPTIONS,
  facetLabels,
  getGenderKey,
  getMonth,
  getMonthBounds,
  getStateCode,
  getTypeKey,
  isAttempt,
  isFullRange,
  rangeLabel,
  sortTypes,
  statesLabel,
} from "./filterUtils";

let protocolRegistered = false;

// Empty MapLibre control; React renders its content through a portal.
class PortalControl {
  constructor(className) {
    this.container = document.createElement("div");
    this.container.className = `maplibregl-ctrl ${className}`;
  }

  onAdd() {
    return this.container;
  }

  onRemove() {
    this.container.remove();
  }
}

const GERMANY_BOUNDS = [[5.87, 47.27], [15.04, 55.06]];
const DESKTOP_HOME = { center: [10.5, 51.3], zoom: 5 };
const DESKTOP_MAX_BOUNDS = [[2.0, 47.0], [18.0, 55.0]];
// Looser on mobile so fitBounds can push Germany between top bar and list sheet.
const MOBILE_MAX_BOUNDS = [[-4.0, 36.0], [24.0, 62.0]];

// Points with an open case, and clusters containing at least one, are drawn in ink and on top.
const HAS_OPEN_CASE = ["any", ["==", ["get", "hasOpen"], true], ["==", ["get", "open"], true]];
const MARKER_COLOR = ["case", HAS_OPEN_CASE, "#172033", "#A541B0"];
const MARKER_SORT_KEY = ["case", HAS_OPEN_CASE, 1, 0];

// Any marker containing a selected case gets the ring, so the selection survives re-clustering on zoom.
const HAS_SELECTED_CASE = ["any", ["==", ["get", "hasSelected"], true], ["==", ["get", "selected"], true]];
const isSelectedFeature = (feature) =>
  feature?.properties?.hasSelected === true || feature?.properties?.selected === true;
const RESELECT_HINT = "Erneut klicken: Auswahl aufheben";

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
  const mobileBarRef = useRef(null);
  const listPanelRef = useRef(null);
  const isDesktop = useMediaQuery("(min-width: 992px)");
  const map = useRef(null);
  const geojsonRef = useRef({ type: "FeatureCollection", features: [] });
  const casesByIdRef = useRef(new Map());
  const languageRef = useRef(language);
  // { cases, ids } of the clicked cluster/point; null = no selection
  const [selection, setSelection] = useState(null);
  const [listLimit, setListLimit] = useState(LIST_PAGE_SIZE);
  // uuids of cases whose details are open; survives filter changes and is highlighted on the map
  const [openCaseIds, setOpenCaseIds] = useState(() => new Set());
  const [filterOpen, setFilterOpen] = useState(false);
  const [actionsEl, setActionsEl] = useState(null);
  // initial camera ("home"); the reset button is disabled while the map is there
  const homeRef = useRef(null);
  const [atHome, setAtHome] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  // null = full data range; otherwise [fromMonth, toMonth] (absolute month indices, inclusive)
  const [range, setRange] = useState(null);
  // selected Bundesland codes; empty = all
  const [states, setStates] = useState([]);
  // selected types of feminicide; empty = all
  const [types, setTypes] = useState([]);
  // Versuch filter: "all" | "no" (completed) | "yes" (attempted)
  const [attempt, setAttempt] = useState("all");
  // selected perpetrator genders ("männlich" | "weiblich" | "unbekannt"); empty = all
  const [gender, setGender] = useState([]);

  useEffect(() => {
    let cancelled = false;

    getCases()
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
        type: getTypeKey(caseItem),
        attempt: isAttempt(caseItem),
        gender: getGenderKey(caseItem),
      }))
      .filter(({ coordinates }) => Array.isArray(coordinates));
  }, [cases]);

  const bounds = useMemo(() => getMonthBounds(entries.map(({ month }) => month)), [entries]);
  const from = bounds ? Math.max(bounds.min, range?.[0] ?? bounds.min) : 0;
  const to = bounds ? Math.min(bounds.max, range?.[1] ?? bounds.max) : 0;
  const fullRange = isFullRange(from, to, bounds);

  // `except` skips one filter, so each section can count "all other filters" without zeroing its own options.
  // Cases without a valid date / Bundesland / type only match while that filter is inactive.
  const matches = useCallback(
    (entry, except = null) =>
      (except === "date" || fullRange || (entry.month !== null && entry.month >= from && entry.month <= to)) &&
      (except === "states" || states.length === 0 || (entry.state !== null && states.includes(entry.state))) &&
      (except === "types" || types.length === 0 || (entry.type !== null && types.includes(entry.type))) &&
      (except === "attempt" || attempt === "all" || entry.attempt === (attempt === "yes")) &&
      (except === "gender" || gender.length === 0 || gender.includes(entry.gender)),
    [fullRange, from, to, states, types, attempt, gender]
  );

  const filteredEntries = useMemo(() => entries.filter((entry) => matches(entry)), [entries, matches]);

  const filteredCases = useMemo(
    () => sortCasesByDateDesc(filteredEntries.map(({ caseItem }) => caseItem)),
    [filteredEntries]
  );

  // Counts per option of one facet, with every other filter applied.
  const countBy = useCallback(
    (except, keyOf) => {
      const counts = {};
      for (const entry of entries) {
        const key = keyOf(entry);
        if (key !== null && matches(entry, except)) {
          counts[key] = (counts[key] ?? 0) + 1;
        }
      }
      return counts;
    },
    [entries, matches]
  );

  const stateCounts = useMemo(() => countBy("states", (entry) => entry.state), [countBy]);
  const typeCounts = useMemo(() => countBy("types", (entry) => entry.type), [countBy]);
  const genderCounts = useMemo(() => countBy("gender", (entry) => entry.gender), [countBy]);
  const attemptCounts = useMemo(() => {
    const counts = countBy("attempt", (entry) => (entry.attempt ? "yes" : "no"));
    return { all: (counts.yes ?? 0) + (counts.no ?? 0), yes: counts.yes ?? 0, no: counts.no ?? 0 };
  }, [countBy]);

  // Histogram: every filter except the date range, so it always shows the whole timeline.
  const monthCounts = useMemo(() => {
    if (!bounds) return [];
    const counts = new Array(bounds.max - bounds.min + 1).fill(0);
    for (const entry of entries) {
      if (entry.month !== null && matches(entry, "date")) {
        counts[entry.month - bounds.min] += 1;
      }
    }
    return counts;
  }, [entries, bounds, matches]);

  const typeOptions = useMemo(
    () => sortTypes(new Set(entries.map((entry) => entry.type).filter(Boolean))),
    [entries]
  );

  const activeCount =
    (fullRange ? 0 : 1) +
    (states.length > 0 ? 1 : 0) +
    (types.length > 0 ? 1 : 0) +
    (attempt !== "all" ? 1 : 0) +
    (gender.length > 0 ? 1 : 0);

  const summary = [rangeLabel(from, to, bounds), statesLabel(states), ...facetLabels({ types, attempt, gender })].join(
    " · "
  );

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
          open: openCaseIds.has(String(caseItem.uuid)),
          selected: selection?.ids.has(String(caseItem.uuid)) ?? false,
        },
      })),
    }),
    [filteredEntries, openCaseIds, selection]
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
      zoom: DESKTOP_HOME.zoom,
      minZoom: 2,
      maxZoom: 12,
      center: DESKTOP_HOME.center,
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

    map.current.doubleClickZoom.disable();

    map.current.on("load", () => {
      setMapLoaded(true);

      map.current.addSource("cases", {
        type: "geojson",
        data: geojsonRef.current,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
        clusterProperties: {
          hasOpen: ["any", ["==", ["get", "open"], true]],
          hasSelected: ["any", ["==", ["get", "selected"], true]],
        },
      });

      // White gap + ink ring around the selected cluster/point, drawn below it.
      map.current.addLayer({
        id: "selection-ring",
        type: "circle",
        source: "cases",
        filter: HAS_SELECTED_CASE,
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
        layout: {
          "circle-sort-key": MARKER_SORT_KEY,
        },
        paint: {
          "circle-color": MARKER_COLOR,
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
        layout: {
          "circle-sort-key": MARKER_SORT_KEY,
        },
        paint: {
          "circle-color": MARKER_COLOR,
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
        if (isSelectedFeature(clusterFeature)) {
          setSelection(null);
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
            ids: new Set(selected.map((caseItem) => String(caseItem.uuid))),
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
        if (isSelectedFeature(e.features[0])) {
          setSelection(null);
          return;
        }

        const selected = casesByIdRef.current.get(String(selectedId));
        if (!selected) {
          return;
        }

        setSelection({ cases: [selected], ids: new Set([String(selectedId)]) });
        setListLimit(LIST_PAGE_SIZE);
      });

      map.current.on("click", (e) => {
        const clusters = map.current.queryRenderedFeatures(e.point, { layers: ["clusters"] });
        const points = map.current.queryRenderedFeatures(e.point, { layers: ["unclustered-point"] });
        if (clusters.length === 0 && points.length === 0) {
          setSelection(null);
        }
      });

      for (const layer of ["clusters", "unclustered-point"]) {
        map.current.on("mousemove", layer, (e) => {
          const canvas = map.current.getCanvas();
          canvas.style.cursor = "pointer";
          canvas.title = isSelectedFeature(e.features?.[0]) ? RESELECT_HINT : "";
        });
        map.current.on("mouseleave", layer, () => {
          const canvas = map.current.getCanvas();
          canvas.style.cursor = "";
          canvas.title = "";
        });
      }
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

  // Max bounds may adjust the requested camera; store the camera the map actually ends up with as home.
  const jumpHome = (mapInstance, camera) => {
    mapInstance.jumpTo(camera);
    homeRef.current = { center: mapInstance.getCenter().toArray(), zoom: mapInstance.getZoom() };
  };

  // Desktop: zoom + filter controls. Mobile: pinch only, Germany framed between top bar and list sheet.
  useEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance || !mapLoaded || isDesktop === null) {
      return undefined;
    }

    if (!isDesktop) {
      mapInstance.setMaxBounds(MOBILE_MAX_BOUNDS);
      const top = mobileBarRef.current?.getBoundingClientRect().bottom ?? 64;
      const bottom = listPanelRef.current?.offsetHeight ?? 0;
      const camera = mapInstance.cameraForBounds(GERMANY_BOUNDS, {
        padding: { top: top + 16, bottom: bottom + 16, left: 16, right: 16 },
      });
      jumpHome(mapInstance, { center: camera.center, zoom: camera.zoom });
      return undefined;
    }

    mapInstance.setMaxBounds(DESKTOP_MAX_BOUNDS);
    jumpHome(mapInstance, DESKTOP_HOME);
    const navigationControl = new maplibregl.NavigationControl({ showCompass: false });
    const actionsControl = new PortalControl("cases-map-actions");
    mapInstance.addControl(navigationControl, "top-right");
    mapInstance.addControl(actionsControl, "top-right");
    setActionsEl(actionsControl.container);

    return () => {
      setActionsEl(null);
      if (map.current === mapInstance) {
        mapInstance.removeControl(actionsControl);
        mapInstance.removeControl(navigationControl);
      }
    };
  }, [isDesktop, mapLoaded]);

  useEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance || !mapLoaded) {
      return undefined;
    }
    const updateAtHome = () => {
      const home = homeRef.current;
      setAtHome(
        !home ||
          (Math.abs(mapInstance.getZoom() - home.zoom) < 0.01 &&
            mapInstance.getCenter().distanceTo(maplibregl.LngLat.convert(home.center)) < 2000)
      );
    };
    updateAtHome();
    mapInstance.on("moveend", updateAtHome);
    return () => mapInstance.off("moveend", updateAtHome);
  }, [mapLoaded, isDesktop]);

  const resetView = useCallback(() => {
    if (map.current && homeRef.current) {
      map.current.flyTo(homeRef.current);
    }
  }, []);


  // Esc clears the selection, except while typing or while the mobile filter sheet handles Esc itself.
  useEffect(() => {
    const handleKey = (event) => {
      if (event.key !== "Escape" || sheetOpen) return;
      if (event.target.closest?.("input, textarea, select, [contenteditable]")) return;
      setSelection(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [sheetOpen]);

  // Changing any filter clears the cluster selection and resets the list pagination.
  useEffect(() => {
    setSelection(null);
    setListLimit(LIST_PAGE_SIZE);
  }, [filteredEntries]);

  const resetFilters = useCallback(() => {
    setRange(null);
    setStates([]);
    setTypes([]);
    setAttempt("all");
    setGender([]);
  }, []);

  const changeRange = useCallback(
    (nextFrom, nextTo) => {
      setRange(isFullRange(nextFrom, nextTo, bounds) ? null : [nextFrom, nextTo]);
    },
    [bounds]
  );

  const toggleState = useCallback((code) => {
    setStates((current) =>
      current.includes(code) ? current.filter((item) => item !== code) : [...current, code].sort()
    );
  }, []);

  const toggleType = useCallback((type) => {
    setTypes((current) =>
      sortTypes(current.includes(type) ? current.filter((item) => item !== type) : [...current, type])
    );
  }, []);

  const toggleGender = useCallback((key) => {
    setGender((current) => {
      const next = current.includes(key) ? current.filter((item) => item !== key) : [...current, key];
      return GENDER_OPTIONS.map(([value]) => value).filter((value) => next.includes(value));
    });
  }, []);

  const toggleOpenCase = useCallback((id, open) => {
    setOpenCaseIds((current) => {
      if (current.has(id) === open) return current;
      const next = new Set(current);
      if (open) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const collapseAllCases = useCallback(() => setOpenCaseIds(new Set()), []);

  const closeSheet = useCallback(() => setSheetOpen(false), []);

  const filters = {
    bounds,
    from,
    to,
    monthCounts,
    stateCounts,
    states,
    typeOptions,
    types,
    typeCounts,
    attempt,
    attemptCounts,
    gender,
    genderCounts,
    activeCount,
    filteredCount: filteredCases.length,
    total: entries.length,
    onRangeChange: changeRange,
    onToggleState: toggleState,
    onToggleType: toggleType,
    onAttemptChange: setAttempt,
    onToggleGender: toggleGender,
    onReset: resetFilters,
  };

  return (
    <div className="cases-map-layout">
      <div className="cases-map-shell">
        <div ref={mapContainer} className="cases-map-canvas" />
        {actionsEl &&
          createPortal(
            <>
              <button
                type="button"
                className={`map-action${filterOpen ? " is-active" : ""}`}
                title="Filter"
                aria-label="Filter"
                aria-expanded={filterOpen}
                onClick={() => setFilterOpen((open) => !open)}
              >
                <FunnelIcon />
                {activeCount > 0 && <span className="filter-badge">{activeCount}</span>}
              </button>
              <button
                type="button"
                className="map-action"
                title="Kartenansicht zurücksetzen"
                aria-label="Kartenansicht zurücksetzen"
                disabled={atHome}
                onClick={resetView}
              >
                <ResetViewIcon />
              </button>
            </>,
            actionsEl
          )}
        {isDesktop && filterOpen && bounds && (
          <FilterPanel filters={filters} onClose={() => setFilterOpen(false)} />
        )}
        {isDesktop === false && bounds && (
          <MobileFilterBar ref={mobileBarRef} filters={filters} onOpen={() => setSheetOpen(true)} />
        )}
      </div>

      <aside className="cases-list-panel" ref={listPanelRef}>
        <div className="sheet-grab" />
        <CaseList
          status={status}
          filteredCases={filteredCases}
          selection={selection?.cases ?? null}
          activeCount={activeCount}
          summary={summary}
          limit={listLimit}
          openCaseIds={openCaseIds}
          onToggleCase={toggleOpenCase}
          onCollapseAll={collapseAllCases}
          onMore={() => setListLimit((limit) => limit + LIST_PAGE_SIZE)}
          onClearSelection={() => setSelection(null)}
          onReset={resetFilters}
        />
      </aside>

      {isDesktop === false && bounds && (
        <MobileFilterSheet filters={filters} open={sheetOpen} onClose={closeSheet} />
      )}
    </div>
  );
}
