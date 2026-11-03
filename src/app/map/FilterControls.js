"use client";

import { useState } from "react";
import { STATE_CODES, STATES } from "./filterUtils";

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

export function FunnelIcon({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 4h18l-7 8.5V19l-4 2v-8.5z" />
    </svg>
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
