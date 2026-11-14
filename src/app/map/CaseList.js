"use client";

import { useEffect, useRef } from "react";
import CaseDetails from "../CaseDetails";
import { FunnelIcon } from "./MapIcons";

export const LIST_PAGE_SIZE = 40;

function casesTitle(count, suffix = "") {
  return `${count} ${count === 1 ? "Fall" : "Fälle"}${suffix}`;
}

export default function CaseList({
  status,
  filteredCases,
  selection,
  limit,
  openCaseIds,
  onToggleCase,
  onMore,
  onReset,
  onOpenFilters,
  filterOpen,
  activeCount,
}) {
  const scrollRef = useRef(null);
  const visibleCases = selection ?? filteredCases;
  const shownCases = visibleCases.slice(0, limit);
  const rest = visibleCases.length - shownCases.length;

  // New filter result or selection: start at the top of the list again.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [filteredCases, selection]);

  const title = selection ? casesTitle(selection.length, " angeklickt") : casesTitle(filteredCases.length);

  return (
    <>
      {status === "ready" && (
        <div className="cases-list-header">
          <h2 className="cases-list-title">{title}</h2>
          {onOpenFilters && (
            <button
              type="button"
              className={`cases-list-filter${filterOpen ? " is-active" : ""}`}
              aria-expanded={filterOpen}
              onClick={onOpenFilters}
            >
              <FunnelIcon size={18} />
              Filter
              {activeCount > 0 && <span className="filter-badge">{activeCount}</span>}
            </button>
          )}
        </div>
      )}

      {status === "loading" && <p className="cases-list-loading">Fälle werden geladen…</p>}
      {status === "error" && <p className="cases-list-empty">Fälle konnten nicht geladen werden.</p>}
      {status === "ready" && visibleCases.length === 0 && (
        <p className="cases-list-empty">
          Keine Fälle für diese Filter.{" "}
          <button type="button" className="link-button" onClick={onReset}>
            Filter zurücksetzen
          </button>
        </p>
      )}

      {status === "ready" && visibleCases.length > 0 && (
        <div className="cases-list-scroll" ref={scrollRef}>
          {shownCases.map((caseItem) => (
            <CaseDetails
              key={caseItem.uuid}
              props={caseItem}
              open={openCaseIds.has(String(caseItem.uuid))}
              onOpenChange={(open) => onToggleCase(String(caseItem.uuid), open)}
            />
          ))}
          {rest > 0 && (
            <button type="button" className="cases-list-more" onClick={onMore}>
              Weitere {Math.min(LIST_PAGE_SIZE, rest)} von {rest} anzeigen
            </button>
          )}
        </div>
      )}
    </>
  );
}
