"use client";

import { useState } from "react";
import { ATTEMPT_OPTIONS, STATE_CODES, STATES } from "./filterUtils";

export function YearPresets({ bounds, from, to, onChange, className = "" }) {
  const firstYear = Math.floor(bounds.min / 12);
  const years = Array.from({ length: (bounds.max - bounds.min + 1) / 12 }, (_, i) => firstYear + i);
  const allActive = from === bounds.min && to === bounds.max;

  return (
    <div className={`year-presets ${className}`}>
      {years.map((year) => {
        const active = from === year * 12 && to === year * 12 + 11;
        return (
          <button
            key={year}
            type="button"
            className={active ? "is-active" : undefined}
            aria-pressed={active}
            onClick={() => onChange(year * 12, year * 12 + 11)}
          >
            {year}
          </button>
        );
      })}
      <button
        type="button"
        className={allActive ? "is-active" : undefined}
        aria-pressed={allActive}
        onClick={() => onChange(bounds.min, bounds.max)}
      >
        Alle
      </button>
    </div>
  );
}

export function StateChecklist({ states, stateCounts, onToggle }) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLocaleLowerCase("de");
  const codes = STATE_CODES.filter((code) => STATES[code].toLocaleLowerCase("de").includes(needle));

  return (
    <>
      <input
        type="search"
        className="state-search"
        placeholder="Bundesland suchen …"
        aria-label="Bundesland suchen"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className="state-checklist">
        {codes.length === 0 && <p className="state-checklist-empty">Kein Bundesland gefunden.</p>}
        {codes.map((code) => {
          const count = stateCounts[code] ?? 0;
          return (
            <label key={code} className={`state-check${count === 0 ? " is-zero" : ""}`}>
              <input type="checkbox" checked={states.includes(code)} onChange={() => onToggle(code)} />
              <span>{STATES[code]}</span>
              <span className="state-count">{count}</span>
            </label>
          );
        })}
      </div>
    </>
  );
}

export function StateToggleGrid({ states, stateCounts, onToggle }) {
  return (
    <div className="state-toggle-grid">
      {STATE_CODES.map((code) => {
        const count = stateCounts[code] ?? 0;
        const active = states.includes(code);
        const classes = ["state-toggle", active && "is-active", count === 0 && "is-zero"].filter(Boolean).join(" ");
        return (
          <button key={code} type="button" className={classes} aria-pressed={active} onClick={() => onToggle(code)}>
            <span>{STATES[code]}</span>
            <em>{count}</em>
          </button>
        );
      })}
    </div>
  );
}

// Checkbox list like the Bundesland list, without search. `options` are [value, label] pairs.
export function FacetChecklist({ options, selected, counts, onToggle }) {
  return (
    <div className="facet-checklist">
      {options.map(([value, label]) => {
        const count = counts[value] ?? 0;
        return (
          <label key={value} className={`state-check${count === 0 ? " is-zero" : ""}`}>
            <input type="checkbox" checked={selected.includes(value)} onChange={() => onToggle(value)} />
            <span>{label}</span>
            <span className="state-count">{count}</span>
          </label>
        );
      })}
    </div>
  );
}

// Segmented single choice "Alle / Vollendet / Versuch".
export function AttemptSwitch({ value, counts, onChange, className = "" }) {
  return (
    <div className={`attempt-switch ${className}`} role="radiogroup" aria-label="Versuch">
      {ATTEMPT_OPTIONS.map(([key, label]) => (
        <button
          key={key}
          type="button"
          role="radio"
          aria-checked={value === key}
          className={value === key ? "is-active" : undefined}
          onClick={() => onChange(key)}
        >
          {label}
          <em>{counts[key] ?? 0}</em>
        </button>
      ))}
    </div>
  );
}
