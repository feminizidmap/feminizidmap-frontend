import "./case-details.css";
import {
  clean,
  cleanList,
  first,
  formatDate,
  judicialStatus,
  knownAge,
  perpetratorLabel,
  stateName,
  withDetails,
} from "./caseFormat";

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
    </article>
  );
}
