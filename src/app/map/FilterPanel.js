"use client";

import { StateChecklist, YearPresets } from "./FilterControls";
import MonthRangeSlider from "./MonthRangeSlider";
import { rangeLabel } from "./filterUtils";

export default function FilterPanel({ filters, onClose }) {
  const { bounds, from, to, monthCounts, onRangeChange, states, stateCounts, onToggleState } = filters;

  return (
    <section className="filter-panel" aria-label="Filter">
      <header className="filter-panel-header">
        <h2>Filter</h2>
        <button type="button" className="filter-panel-close" aria-label="Filter schliessen" onClick={onClose}>
          ×
        </button>
      </header>

      <div className="filter-panel-body">
        <div className="filter-section">
          <div className="filter-section-header">
            <span className="filter-label">Zeitraum</span>
            <span className="filter-value">{rangeLabel(from, to, bounds)}</span>
          </div>
          <MonthRangeSlider bounds={bounds} from={from} to={to} counts={monthCounts} onChange={onRangeChange} />
          <YearPresets bounds={bounds} from={from} to={to} onChange={onRangeChange} />
        </div>

        <div className="filter-section">
          <div className="filter-section-header">
            <span className="filter-label">Bundesland</span>
            <span className="filter-value">{states.length === 0 ? "Alle" : `${states.length} ausgewählt`}</span>
          </div>
          <StateChecklist states={states} stateCounts={stateCounts} onToggle={onToggleState} />
        </div>
      </div>

      <FilterFooter filters={filters} />
    </section>
  );
}

function FilterFooter({ filters }) {
  const { activeCount, filteredCount, total, onReset } = filters;
  return (
    <footer className="filter-panel-footer">
      <button type="button" className="link-button" disabled={activeCount === 0} onClick={onReset}>
        Zurücksetzen
      </button>
      <span className="filter-panel-count">
        <b>{filteredCount}</b> von {total} Fällen
      </span>
    </footer>
  );
}
