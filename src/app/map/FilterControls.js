"use client";

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
