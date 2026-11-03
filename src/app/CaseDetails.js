import "./case-details.css";
import {
  RISK_FACTORS,
  clean,
  cleanList,
  dependantsText,
  first,
  formatDate,
  judicialStatus,
  knownAge,
  perpetratorLabel,
  stateName,
  withDetails,
} from "./caseFormat";

function isEmptyValue(value) {
  return value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
}

// Rows without a value are left out; sections without rows are left out entirely.
function DetailsSection({ title, rows, children }) {
  const visibleRows = rows.filter(([, value]) => !isEmptyValue(value));
  if (visibleRows.length === 0 && !children) {
    return null;
  }
  return (
    <section className="case-details-section">
      <h4 className="case-details-label">{title}</h4>
      {visibleRows.length > 0 && (
        <dl className="case-details-list">
          {visibleRows.map(([label, value]) => (
            <div key={label} className="case-details-row">
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {children}
    </section>
  );
}

function RiskFactors({ perpetrator }) {
  const known = RISK_FACTORS.map(([label, key]) => [label, clean(perpetrator[key])]).filter(
    ([, value]) => value && !/^(unbekannt|keine angabe)/i.test(value)
  );
  if (known.length === 0) {
    return <span className="case-details-muted">Keine Angaben</span>;
  }
  return (
    <span className="case-risk-factors">
      {known.map(([label, value]) => (
        <span key={label} className={value === "Ja" ? "is-yes" : undefined}>
          {label}
          <em>{value}</em>
        </span>
      ))}
    </span>
  );
}

function joinWithDetails(values, details) {
  const text = cleanList(values).join(", ");
  const extra = clean(details);
  if (text && extra) {
    return `${text} (${extra})`;
  }
  return text || extra;
}

export default function CaseDetails({ props }) {
  const crime = first(props.crime) ?? {};
  const victim = first(props.victims) ?? {};
  const perpetrator = first(props.perpetrators) ?? {};

  const place = [clean(crime.crime_city), stateName(props)].filter(Boolean).join(" · ");
  const victimAge = knownAge(victim.age);
  const perpetratorAge = knownAge(perpetrator.age);
  const relationship = withDetails(victim.relationship_perpetrator, victim.relationship_perpetrator_details);
  const causeOfDeath = clean(crime.cause_of_death);
  const status = judicialStatus(perpetrator.judical_status);
  const sentence = clean(perpetrator.sentence);
  const suicide = clean(perpetrator.committed_suicide);
  const mediaLabels = cleanList(props.media_labels);
  const sentenceDetails = clean(perpetrator.sentence_details);
  const footer = [
    clean(props.identifier),
    formatDate(props.registration_date) && `erfasst ${formatDate(props.registration_date)}`,
  ].filter(Boolean);

  const tags = [
    withDetails(victim.type_of_feminicide, victim.type_of_feminicide_details),
    clean(crime.location_of_body),
    cleanList(crime.motives)[0],
  ];

  return (
    <article className="case-card">
      <div className="case-card-meta">
        {formatDate(props.crime_date) && <b>{formatDate(props.crime_date)}</b>}
        {place && <span>{place}</span>}
        {props.attempt === true && <span className="case-card-flag">Versuch, überlebt</span>}
      </div>

      <h3 className="case-card-name">
        {clean(victim.name) ?? "Name unbekannt"}
        <span>, {victimAge ? `${victimAge} Jahre` : "Alter unbekannt"}</span>
      </h3>

      {(relationship || perpetratorAge || causeOfDeath) && (
        <p className="case-card-summary">
          {(relationship || perpetratorAge) && (
            <>
              {perpetratorLabel(perpetrator)}: {relationship && <b>{relationship}</b>}
              {relationship && perpetratorAge && ", "}
              {perpetratorAge && `${perpetratorAge} J.`}
            </>
          )}
          {(relationship || perpetratorAge) && causeOfDeath && " · "}
          {causeOfDeath}
        </p>
      )}

      {tags.some(Boolean) && (
        <div className="case-card-tags">
          {tags.map(
            (tag, index) =>
              tag && (
                <span key={index} className={`case-card-tag${index === 0 ? " is-type" : ""}`}>
                  {tag}
                </span>
              )
          )}
        </div>
      )}

      <p className="case-card-status">
        <i style={{ background: status.color }} />
        <span>
          <b>{status.label}</b>
          {sentence && sentence !== "Entfällt" && ` · ${sentence}`}
        </span>
      </p>

      <details className="case-details">
        <summary>Alle Details</summary>
        <div className="case-details-content">
          <DetailsSection
            title="Opfer"
            rows={[
              ["Name", clean(victim.name)],
              ["Alter", victimAge && `${victimAge} Jahre`],
              ["Familienstand", clean(victim.family_status)],
              ["Beruf", withDetails(victim.profession, victim.profession_details)],
              ["Frühere Gewalt bekannt", clean(victim.reports_on_violence)],
              ["Hinterbliebene", dependantsText(victim.surviving_dependants)],
            ]}
          />
          <DetailsSection
            title={perpetratorLabel(perpetrator)}
            rows={[
              ["Beziehung zum Opfer", relationship],
              ["Alter", perpetratorAge && `${perpetratorAge} Jahre`],
              ["Beruf", withDetails(perpetrator.profession, perpetrator.profession_details)],
              ["Wohnort", clean(perpetrator.perpetrator_city)],
              ["Suizid", suicide !== "Nein" ? suicide : null],
              ["Risikofaktoren", <RiskFactors key="risk" perpetrator={perpetrator} />],
            ]}
          />
          {/* acts_of_violence_details is intentionally not shown; it can be very graphic. */}
          <DetailsSection
            title="Tat"
            rows={[
              ["Tatort", [clean(crime.crime_city), stateName(props)].filter(Boolean).join(", ")],
              ["Fundort", clean(crime.location_of_body)],
              ["Todesursache", causeOfDeath],
              ["Tatmittel", joinWithDetails(crime.weapons, crime.weapon_details)],
              ["Weitere Gewalt", cleanList(crime.further_acts_of_violence).join(", ")],
              ["Motiv", joinWithDetails(crime.motives, crime.motive_details)],
              ["Bekannt durch", clean(props.report_of_crime)],
            ]}
          />
          <DetailsSection
            title="Justiz"
            rows={[
              ["Status", clean(perpetrator.judical_status)],
              ["Urteil", sentence],
            ]}
          >
            {sentenceDetails && <p className="case-details-note">{sentenceDetails}</p>}
          </DetailsSection>
          {mediaLabels.length > 0 && (
            <DetailsSection
              title="Medien"
              rows={[
                [
                  "Bezeichnet als",
                  <>
                    {mediaLabels.map((label) => `„${label}“`).join(", ")}
                    <span className="case-details-hint">Begriff aus der Berichterstattung</span>
                  </>,
                ],
              ]}
            />
          )}
          {footer.length > 0 && <p className="case-details-id">{footer.join(" · ")}</p>}
        </div>
      </details>
    </article>
  );
}
