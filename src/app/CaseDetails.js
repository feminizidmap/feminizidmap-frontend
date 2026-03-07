export default function CaseDetails({ props }) {
    const crime = Array.isArray(props.crime) ? props.crime[0] : props.crime;
    const victim = Array.isArray(props.victims) ? props.victims[0] : props.victims;
    const perpetrator = Array.isArray(props.perpetrators) ? props.perpetrators[0] : props.perpetrators;
    const sources = Array.isArray(props.source) ? props.source : [];
    const city = props?.crime.crime_city || "Unbekannt";
    const subtitleParts = [props?.crime_date, city].filter(Boolean);

    const perpRelation = victim?.relationship_perpetrator.startsWith("Sonstig") ? `${victim?.relationship_perpetrator_details} des Opfers` : `${victim?.relationship_perpetrator} des Opfers`;

    const feminicideType = victim?.type_of_feminicide.startsWith("Sonstig") ? victim?.type_of_feminicide_details : victim?.type_of_feminicide;
  
  return (
    <article className="case-card">
      <p className="case-card-meta">{subtitleParts.join(" · ")}</p>
      <p className="case-card-description">
      Opfer: {victim?.name || "Unbekannt"} ({victim?.age || "Unbekannt"})
      </p>

      <details className="case-details">
        <summary>Mehr Details</summary>
      <div className="case-details-content">
      <p className="case-details-row">
      Art des Femi(ni)zids: <b>{feminicideType}</b>
      </p>
      <p className="case-details-row">
      Täter: {perpRelation} ({perpetrator?.age || "Unbekannt"}) 
      </p>
        </div>
      </details>
    </article>
  );
};
