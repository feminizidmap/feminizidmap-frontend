"use client";

import { AttemptSwitch, FacetChecklist, StateChecklist, YearPresets } from "./FilterControls";
import MonthRangeSlider from "./MonthRangeSlider";
import { ATTEMPT_OPTIONS, GENDER_OPTIONS, rangeLabel, selectionLabel } from "./filterUtils";

export default function FilterPanel({ filters, onClose }) {
  const { bounds, from, to, monthCounts, onRangeChange, states, stateCounts, onToggleState } = filters;
  const { typeOptions, types, typeCounts, onToggleType, attempt, attemptCounts, onAttemptChange } = filters;
  const { gender, genderCounts, onToggleGender } = filters;

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
            <span className="filter-label">Art des Femi(ni)zids</span>
            <span className="filter-value">{selectionLabel(types)}</span>
          </div>
          <FacetChecklist
            options={typeOptions.map((type) => [type, type])}
            selected={types}
            counts={typeCounts}
            onToggle={onToggleType}
          />
        </div>

        <div className="filter-section">
          <div className="filter-section-header">
            <span className="filter-label">Versuch</span>
            <span className="filter-value">{ATTEMPT_OPTIONS.find(([key]) => key === attempt)[1]}</span>
          </div>
          <AttemptSwitch value={attempt} counts={attemptCounts} onChange={onAttemptChange} />
        </div>

        {/* "des*der Täter*in": we deliberately avoid the rarely used "Täters*in" */}
        <div className="filter-section">
          <div className="filter-section-header">
            <span className="filter-label">Geschlecht des*der Täter*in</span>
            <span className="filter-value">{selectionLabel(gender)}</span>
          </div>
          <FacetChecklist options={GENDER_OPTIONS} selected={gender} counts={genderCounts} onToggle={onToggleGender} />
        </div>

        <div className="filter-section">
          <div className="filter-section-header">
            <span className="filter-label">Bundesland</span>
            <span className="filter-value">{selectionLabel(states)}</span>
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
