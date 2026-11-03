"use client";

import { forwardRef, useEffect } from "react";
import { FunnelIcon, StateToggleGrid, YearPresets } from "./FilterControls";
import MonthRangeSlider from "./MonthRangeSlider";
import { STATES, isFullRange, rangeLabel } from "./filterUtils";

export const MobileFilterBar = forwardRef(function MobileFilterBar({ filters, onOpen }, ref) {
  const { bounds, from, to, states, activeCount, onRangeChange, onToggleState } = filters;
  const fullRange = isFullRange(from, to, bounds);

  return (
    <div className="mobile-filter-bar" ref={ref}>
      <button type="button" className="mobile-filter-button" onClick={onOpen}>
        <FunnelIcon size={18} />
        Filter
        {activeCount > 0 && <span className="filter-badge">{activeCount}</span>}
      </button>

      {activeCount === 0 ? (
        <button type="button" className="mobile-filter-chip" onClick={onOpen}>
          Alle Jahre · Alle Bundesländer
        </button>
      ) : (
        <>
          {!fullRange && (
            <button
              type="button"
              className="mobile-filter-chip"
              aria-label={`Zeitraum ${rangeLabel(from, to, bounds)} entfernen`}
              onClick={() => onRangeChange(bounds.min, bounds.max)}
            >
              {rangeLabel(from, to, bounds)}
              <span aria-hidden="true">×</span>
            </button>
          )}
          {states.map((code) => (
            <button
              key={code}
              type="button"
              className="mobile-filter-chip"
              aria-label={`${STATES[code]} entfernen`}
              onClick={() => onToggleState(code)}
            >
              {STATES[code]}
              <span aria-hidden="true">×</span>
            </button>
          ))}
        </>
      )}
    </div>
  );
});

export function MobileFilterSheet({ filters, open, onClose }) {
  const { bounds, from, to, monthCounts, onRangeChange, states, stateCounts, onToggleState } = filters;
  const { activeCount, filteredCount, onReset } = filters;

  useEffect(() => {
    if (!open) return undefined;
    const handleKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  return (
    <>
      <div className={`mobile-dim${open ? " is-open" : ""}`} onClick={onClose} aria-hidden="true" />
      <section
        className={`mobile-filter-sheet${open ? " is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Filter"
        aria-hidden={!open}
      >
        <div className="sheet-grab" />
        <header className="mobile-filter-sheet-header">
          <h2>Filter</h2>
          <button type="button" className="mobile-filter-sheet-close" aria-label="Filter schliessen" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="mobile-filter-sheet-body">
          <div className="mobile-filter-section">
            <div className="filter-section-header">
              <span className="filter-label">Zeitraum</span>
              <span className="filter-value">{rangeLabel(from, to, bounds)}</span>
            </div>
            <MonthRangeSlider bounds={bounds} from={from} to={to} counts={monthCounts} onChange={onRangeChange} />
            <YearPresets bounds={bounds} from={from} to={to} onChange={onRangeChange} className="is-mobile" />
          </div>

          <div className="mobile-filter-section">
            <div className="filter-section-header">
              <span className="filter-label">Bundesland</span>
              <span className="filter-value">{states.length === 0 ? "Alle" : `${states.length} ausgewählt`}</span>
            </div>
            <StateToggleGrid states={states} stateCounts={stateCounts} onToggle={onToggleState} />
          </div>
        </div>

        <footer className="mobile-filter-sheet-footer">
          <button type="button" className="link-button" disabled={activeCount === 0} onClick={onReset}>
            Zurücksetzen
          </button>
          {/* Filters apply live; this button only closes the sheet. */}
          <button type="button" className="mobile-filter-apply" onClick={onClose}>
            {filteredCount} {filteredCount === 1 ? "Fall" : "Fälle"} anzeigen
          </button>
        </footer>
      </section>
    </>
  );
}
