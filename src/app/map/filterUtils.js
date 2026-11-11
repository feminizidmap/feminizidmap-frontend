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

// Geocoding often leaves the state empty for the city-states, so derive it from the city.
// Exact match only: "Berlingen" or "Hamburger Straße" must not count.
const CITY_STATES = {
  berlin: "BE",
  hamburg: "HH",
  bremen: "HB",
  bremerhaven: "HB",
};

export function stateCodeFromCity(value) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }
  return CITY_STATES[normalizeStateName(value).replace(/^stadtgebiet /, "")] ?? null;
}

export function getStateCode(caseItem) {
  const perpetrator = Array.isArray(caseItem?.perpetrators) ? caseItem.perpetrators[0] : caseItem?.perpetrators;
  return (
    stateCodeFromName(caseItem?.crime?.crime_state) ??
    stateCodeFromCity(caseItem?.crime?.crime_city) ??
    stateCodeFromName(perpetrator?.perpetrator_state) ??
    stateCodeFromCity(perpetrator?.perpetrator_city)
  );
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

// Facet filters: Art des Femi(ni)zids, Versuch, Geschlecht des*der Täter*in

function firstOf(value) {
  return Array.isArray(value) ? value[0] : value;
}

// The API has trailing spaces in its values ("Familiär ").
export function getTypeKey(caseItem) {
  const type = firstOf(caseItem?.victims)?.type_of_feminicide;
  return typeof type === "string" && type.trim() ? type.trim() : null;
}

// "männlich" / "weiblich"; null, empty and any other value count as unknown.
export function getGenderKey(caseItem) {
  const gender = firstOf(caseItem?.perpetrators)?.gender;
  const key = typeof gender === "string" ? gender.trim().toLowerCase() : "";
  return key === "männlich" || key === "weiblich" ? key : "unbekannt";
}

export function isAttempt(caseItem) {
  return caseItem?.attempt === true;
}

export const KNOWN_TYPES = ["Intim", "Familiär", "Nicht intim"];

// Known types in their usual order, further types from the data alphabetically.
export function sortTypes(types) {
  const rank = (type) => (KNOWN_TYPES.includes(type) ? KNOWN_TYPES.indexOf(type) : KNOWN_TYPES.length);
  return [...types].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b, "de"));
}

export const GENDER_OPTIONS = [
  ["männlich", "Männlich"],
  ["weiblich", "Weiblich"],
  ["unbekannt", "Unbekannt"],
];

export const ATTEMPT_OPTIONS = [
  ["all", "Alle"],
  ["no", "Vollendet"],
  ["yes", "Versuch"],
];

export function genderOptionLabel(key) {
  return GENDER_OPTIONS.find(([value]) => value === key)?.[1] ?? key;
}

export const ATTEMPT_CHIP_LABELS = { yes: "Nur Versuche", no: "Nur vollendete" };

// One label per active facet, e.g. ["Intim", "Nur Versuche", "Täter*in: weiblich"].
export function facetLabels({ types, attempt, gender }) {
  const labels = [];
  if (types.length > 0) {
    labels.push(types.join(", "));
  }
  if (attempt !== "all") {
    labels.push(attempt === "yes" ? "Nur Versuche" : "Nur vollendete Taten");
  }
  if (gender.length > 0) {
    labels.push(`Täter*in: ${gender.map((key) => genderOptionLabel(key).toLowerCase()).join(", ")}`);
  }
  return labels;
}
