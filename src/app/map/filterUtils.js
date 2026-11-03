export const STATES = {
  BW: "Baden-Württemberg",
  BY: "Bayern",
  BE: "Berlin",
  BB: "Brandenburg",
  HB: "Bremen",
  HH: "Hamburg",
  HE: "Hessen",
  MV: "Mecklenburg-Vorpommern",
  NI: "Niedersachsen",
  NW: "Nordrhein-Westfalen",
  RP: "Rheinland-Pfalz",
  SL: "Saarland",
  SN: "Sachsen",
  ST: "Sachsen-Anhalt",
  SH: "Schleswig-Holstein",
  TH: "Thüringen",
};

export const STATE_CODES = Object.keys(STATES).sort((a, b) => STATES[a].localeCompare(STATES[b], "de"));

// The API delivers crime_state in English (e.g. "North Rhine-Westphalia").
const STATE_ALIASES = {
  "baden-wurttemberg": "BW",
  bavaria: "BY",
  hesse: "HE",
  "lower saxony": "NI",
  "mecklenburg-western pomerania": "MV",
  "mecklenburg-west pomerania": "MV",
  "north rhine-westphalia": "NW",
  "rhineland-palatinate": "RP",
  saxony: "SN",
  "saxony-anhalt": "ST",
  thuringia: "TH",
};

for (const [code, name] of Object.entries(STATES)) {
  STATE_ALIASES[name.toLowerCase()] = code;
  STATE_ALIASES[code.toLowerCase()] = code;
}

function normalizeStateName(value) {
  return value.trim().toLowerCase().replace(/\s+/g, " ").replace(/\s*-\s*/g, "-");
}

export function stateCodeFromName(value) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }
  return STATE_ALIASES[normalizeStateName(value)] ?? null;
}

export function getStateCode(caseItem) {
  const perpetrator = Array.isArray(caseItem?.perpetrators) ? caseItem.perpetrators[0] : caseItem?.perpetrators;
  return stateCodeFromName(caseItem?.crime?.crime_state) ?? stateCodeFromName(perpetrator?.perpetrator_state);
}

// Months are absolute indices (year * 12 + month0) so ranges can span years.
export function getMonth(caseItem) {
  const match = /^(\d{4})-(\d{2})/.exec(caseItem?.crime_date || "");
  if (!match) {
    return null;
  }
  const month = Number(match[2]);
  return month >= 1 && month <= 12 ? Number(match[1]) * 12 + month - 1 : null;
}

// Bounds are snapped to whole years so the year axis and presets line up.
export function getMonthBounds(months) {
  const valid = months.filter((month) => month !== null);
  if (valid.length === 0) {
    return null;
  }
  return {
    min: Math.floor(Math.min(...valid) / 12) * 12,
    max: Math.floor(Math.max(...valid) / 12) * 12 + 11,
  };
}

export const MONTHS_DE = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

export function monthLabel(month) {
  return `${MONTHS_DE[month % 12]} ${Math.floor(month / 12)}`;
}

export function isFullRange(from, to, bounds) {
  return !bounds || (from === bounds.min && to === bounds.max);
}

export function rangeLabel(from, to, bounds) {
  if (isFullRange(from, to, bounds)) {
    return "Alle Jahre";
  }
  if (from % 12 === 0 && to % 12 === 11) {
    const fromYear = Math.floor(from / 12);
    const toYear = Math.floor(to / 12);
    return fromYear === toYear ? String(fromYear) : `${fromYear}–${toYear}`;
  }
  return from === to ? monthLabel(from) : `${monthLabel(from)} – ${monthLabel(to)}`;
}

export function statesLabel(states) {
  if (states.length === 0) {
    return "Alle Bundesländer";
  }
  if (states.length <= 2) {
    return states.map((code) => STATES[code]).join(", ");
  }
  return `${states.length} Bundesländer`;
}
