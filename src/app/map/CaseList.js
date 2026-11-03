"use client";

import { useEffect, useRef } from "react";
import CaseDetails from "../CaseDetails";

export const LIST_PAGE_SIZE = 40;

function casesTitle(count, suffix = "") {
  return `${count} ${count === 1 ? "Fall" : "Fälle"}${suffix}`;
}

export default function CaseList({
  status,
  filteredCases,
  selection,
  activeCount,
  summary,
  limit,
  openCaseIds,
  onToggleCase,
  onCollapseAll,
  onMore,
  onClearSelection,
  onReset,
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

  const kicker = selection ? "Auswahl auf der Karte" : activeCount > 0 ? "Gefilterte Fälle" : "Alle Fälle";
  const title = selection ? casesTitle(selection.length, " angeklickt") : casesTitle(filteredCases.length);
  const sub = selection ? `aus ${filteredCases.length} gefilterten Fällen` : summary;

  return (
    <>
      <div className="cases-list-header">
        <div className="cases-list-heading">
          <p className="cases-list-kicker">{kicker}</p>
          {status === "ready" && (
            <>
              <h2 className="cases-list-title">{title}</h2>
              <p className="cases-list-sub">{sub}</p>
            </>
          )}
        </div>
        <div className="cases-list-actions">
          <button
            type="button"
            className="cases-list-close"
            disabled={openCaseIds.size === 0}
            title={openCaseIds.size > 0 ? `${openCaseIds.size} geöffnet` : undefined}
            onClick={onCollapseAll}
          >
            Alle einklappen
          </button>
          {selection && (
            <button type="button" className="cases-list-close" onClick={onClearSelection}>
              Schliessen
            </button>
          )}
        </div>
      </div>

      {status === "loading" && <p className="cases-list-empty">Fälle werden geladen…</p>}
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
