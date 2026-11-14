import { STATES, genderOptionLabel, getStateCode, normalizeGender } from "./map/filterUtils";

// API values carry trailing spaces ("Familiär ") and form hints ("Stichwaffen (bitte angeben)").
export function clean(value) {
  if (typeof value === "number") {
    return String(value);
  }
  if (typeof value !== "string") {
    return null;
  }
  const cleaned = value.replace(/\s*\(bitte angeben\)/gi, "").trim();
  return cleaned || null;
}

export function cleanList(values) {
  return Array.isArray(values) ? values.map(clean).filter(Boolean) : [];
}

export function first(value) {
  return Array.isArray(value) ? value[0] : value;
}

// "Sonstige…" options come with a free-text details field.
export function withDetails(value, details) {
  const cleaned = clean(value);
  if (cleaned?.startsWith("Sonstig")) {
    return clean(details) ?? cleaned;
  }
  return cleaned;
}

// An age of 0 means unknown.
export function knownAge(value) {
  const age = Number(value);
  return Number.isFinite(age) && age > 0 ? age : null;
}

function blocksToText(node) {
  if (!node) return "";
  if (typeof node.text === "string") return node.text;
  if (Array.isArray(node.children)) return node.children.map(blocksToText).join("");
  if (Array.isArray(node)) return node.map(blocksToText).join(" ");
  return "";
}

// First `wordCount` words of a Strapi blocks-format rich text field, for use as a teaser.
export function teaser(content, wordCount = 100) {
  const text = blocksToText(content).replace(/\s+/g, " ").trim();
  if (!text) return null;
  const words = text.split(" ");
  return words.length <= wordCount ? text : `${words.slice(0, wordCount).join(" ")}…`;
}

export function formatDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value || "");
  return match ? `${match[3]}.${match[2]}.${match[1]}` : null;
}

export function stateName(caseItem) {
  return STATES[getStateCode(caseItem)] ?? null;
}

// City plus state, without repeating the state for city-states ("Berlin", not "Berlin · Berlin").
export function placeLabel(caseItem, separator) {
  const city = clean(first(caseItem?.crime)?.crime_city);
  const state = stateName(caseItem);
  const showState = state && state.toLowerCase() !== city?.toLowerCase();
  return [city, showState ? state : null].filter(Boolean).join(separator);
}

const PERPETRATOR_LABELS = { männlich: "Täter", weiblich: "Täterin", unbekannt: "Täter*in" };

export function perpetratorLabel(perpetrator) {
  return PERPETRATOR_LABELS[normalizeGender(perpetrator?.gender)];
}

// "Männlich" / "Weiblich" / "Unbekannt"
export function genderLabel(perpetrator) {
  return genderOptionLabel(normalizeGender(perpetrator?.gender));
}

const JUDICIAL_STATUS = {
  Verurteilt: ["Verurteilt", "#172033"],
  Untersuchungshaft: ["Untersuchungshaft", "#c27a12"],
  Flüchtig: ["Täter flüchtig", "#c27a12"],
  Freigelassen: ["Freigelassen", "#c27a12"],
  "Unterbringung in psychiatrischer Klinik vor Gerichtsurteil": ["Psychiatrie, vor Urteil", "#c27a12"],
  "Unterbringung in psychiatrischer Klinik nach Gerichtsurteil": ["Psychiatrie nach Urteil", "#384B70"],
  "Fall wegen Todes abgeschlossen": ["Abgeschlossen: Suizid des Täters", "#a3abb8"],
};

export function judicialStatus(value) {
  const raw = clean(value);
  const [label, color] = JUDICIAL_STATUS[raw] ?? [raw ?? "Status unbekannt", "#a3abb8"];
  return { label, color };
}

export const RISK_FACTORS = [
  ["Alkohol", "influence_alcohol"],
  ["Drogen", "influence_drugs"],
  ["Psych. Erkrankung", "mental_illness"],
  ["Vorstrafen", "criminal_record"],
  ["Kontaktverbot", "restraining_order"],
];

const PLURALS = { Kind: "Kinder" };

// e.g. "3 Kinder (7, 12, 16 J.)"
export function dependantsText(dependants) {
  if (!Array.isArray(dependants) || dependants.length === 0) {
    return null;
  }
  const groups = new Map();
  for (const dependant of dependants) {
    const relation = clean(dependant?.relationship_to_victim) ?? "Angehörige";
    groups.set(relation, [...(groups.get(relation) ?? []), knownAge(dependant?.age)]);
  }
  return [...groups]
    .map(([relation, ages]) => {
      const known = ages.filter((age) => age !== null).sort((a, b) => a - b);
      const name = ages.length === 1 ? relation : PLURALS[relation] ?? relation;
      return `${ages.length} ${name}${known.length ? ` (${known.join(", ")} J.)` : ""}`;
    })
    .join(", ");
}
