export default function CaseDetails({ props }) {
    const crime = Array.isArray(props.crime) ? props.crime[0] : props.crime;
    const victim = Array.isArray(props.victim) ? props.victim[0] : props.victim;
    const perpetrator = Array.isArray(props.perpetrator) ? props.perpetrator[0] : props.perpetrator;
    const sources = Array.isArray(props.source) ? props.source : [];
    const city = props?.crime.crime_geolocation_city || props?.victim.victim_geolocation_city || "Unbekannt";
    const subtitleParts = [props?.crime_date, city].filter(Boolean);

    const victimName = (victim?.firstname || victim?.lastname) ? `${victim?.firstname} ${victim?.lastname?.slice(0,1)}.` : "Unbekannt";
    const perpName = (perpetrator?.firstname || perpetrator?.lastname) ? `${perpetrator?.lastname} ${perpetrator?.firstname}` : "Unbekannt";
    const perpRelation = victim.relationship_perpetrator_details ? `${victim.relationship_perpetrator_details} des Opfers` : "Fremder"

  return (
    <article className="case-card">
      <p className="case-card-meta">{subtitleParts.join(" · ")} {crime.attempt}</p>
      <p className="case-card-description">
      Opfer: {victimName} ({victim?.age || "Unbekannt"})
      </p>

      <details className="case-details">
        <summary>Mehr Details</summary>
      <div className="case-details-content">
      <p className="case-details-row">
      <p className="case-details-row">
      Typ: <b>{crime?.type_of_feminicide?.label || "-"}</b>
      </p>
      Täter: {perpName} ({perpetrator.age}) · {perpRelation}
      </p>
          <p className="case-details-row">
            Todesursache: <b>{crime?.cause_of_death?.label || "-"}</b>
          </p>
          
          <p className="case-details-row">
            Tatwaffe: <b>{crime?.weapon_details || "-"}</b>
          </p>
         
        </div>
      </details>
    </article>
  );
};
