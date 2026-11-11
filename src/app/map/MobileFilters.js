"use client";

import { forwardRef, useEffect } from "react";
import { AttemptSwitch, FacetToggleGrid, StateToggleGrid, YearPresets } from "./FilterControls";
import { FunnelIcon } from "./MapIcons";
import MonthRangeSlider from "./MonthRangeSlider";
import {
  ATTEMPT_CHIP_LABELS,
  ATTEMPT_OPTIONS,
  GENDER_OPTIONS,
  STATES,
  genderOptionLabel,
  isFullRange,
  rangeLabel,
  selectionLabel,
} from "./filterUtils";

function FilterChip({ label, onRemove }) {
  return (
    <button type="button" className="mobile-filter-chip" aria-label={`${label} entfernen`} onClick={onRemove}>
      {label}
      <span aria-hidden="true">×</span>
    </button>
  );
}

export const MobileFilterBar = forwardRef(function MobileFilterBar({ filters, onOpen }, ref) {
  const { bounds, from, to, states, activeCount, onRangeChange, onToggleState } = filters;
  const { types, onToggleType, attempt, onAttemptChange, gender, onToggleGender } = filters;
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
            <FilterChip label={rangeLabel(from, to, bounds)} onRemove={() => onRangeChange(bounds.min, bounds.max)} />
          )}
          {states.map((code) => (
            <FilterChip key={code} label={STATES[code]} onRemove={() => onToggleState(code)} />
          ))}
          {types.map((type) => (
            <FilterChip key={type} label={type} onRemove={() => onToggleType(type)} />
          ))}
          {attempt !== "all" && (
            <FilterChip label={ATTEMPT_CHIP_LABELS[attempt]} onRemove={() => onAttemptChange("all")} />
          )}
          {gender.map((key) => (
            <FilterChip
              key={key}
              label={`Täter*in: ${genderOptionLabel(key).toLowerCase()}`}
              onRemove={() => onToggleGender(key)}
            />
          ))}
        </>
      )}
    </div>
  );
});

export function MobileFilterSheet({ filters, open, onClose }) {
  const { bounds, from, to, monthCounts, onRangeChange, states, stateCounts, onToggleState } = filters;
  const { typeOptions, types, typeCounts, onToggleType, attempt, attemptCounts, onAttemptChange } = filters;
  const { gender, genderCounts, onToggleGender, activeCount, filteredCount, onReset } = filters;

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
              <span className="filter-label">Art des Femi(ni)zids</span>
              <span className="filter-value">{selectionLabel(types)}</span>
            </div>
            <FacetToggleGrid
              options={typeOptions.map((type) => [type, type])}
              selected={types}
              counts={typeCounts}
              onToggle={onToggleType}
            />
          </div>

          <div className="mobile-filter-section">
            <div className="filter-section-header">
              <span className="filter-label">Versuch</span>
              <span className="filter-value">{ATTEMPT_OPTIONS.find(([key]) => key === attempt)[1]}</span>
            </div>
            <AttemptSwitch value={attempt} counts={attemptCounts} onChange={onAttemptChange} className="is-mobile" />
          </div>

          <div className="mobile-filter-section">
            <div className="filter-section-header">
              <span className="filter-label">Geschlecht des*der Täter*in</span>
              <span className="filter-value">{selectionLabel(gender)}</span>
            </div>
            <FacetToggleGrid options={GENDER_OPTIONS} selected={gender} counts={genderCounts} onToggle={onToggleGender} />
          </div>

          <div className="mobile-filter-section">
            <div className="filter-section-header">
              <span className="filter-label">Bundesland</span>
              <span className="filter-value">{selectionLabel(states)}</span>
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
