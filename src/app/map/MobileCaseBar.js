"use client";

import { forwardRef } from "react";
import { ChevronUpIcon } from "./MapIcons";

function casesCount(count, suffix = "") {
  return `${count} ${count === 1 ? "Fall" : "Fälle"}${suffix}`;
}

// Mobile: always visible below the map. Summarizes the current cases and opens the full-screen case panel.
const MobileCaseBar = forwardRef(function MobileCaseBar(
  { status, filteredCount, selectionCount, summary, onOpenList, onClearSelection },
  ref
) {
  const hasSelection = selectionCount !== null;
  const title =
    status === "loading"
      ? "Fälle werden geladen…"
      : status === "error"
        ? "Fälle konnten nicht geladen werden"
        : hasSelection
          ? casesCount(selectionCount, " angeklickt")
          : casesCount(filteredCount);
  const sub = hasSelection ? `aus ${filteredCount} gefilterten Fällen` : summary;

  return (
    <div className="mobile-case-bar" ref={ref}>
      <div className="mobile-case-bar-text">
        <b>{title}</b>
        {status === "ready" && <span>{sub}</span>}
      </div>
      {hasSelection && (
        <button type="button" className="mobile-case-bar-clear" aria-label="Auswahl aufheben" onClick={onClearSelection}>
          ×
        </button>
      )}
      <button
        type="button"
        className="mobile-case-bar-list"
        disabled={status !== "ready"}
        onClick={onOpenList}
      >
        Liste
        <ChevronUpIcon />
      </button>
    </div>
  );
});

export default MobileCaseBar;
