export default function CaseDetails({ props }) {


    console.log(props);
    
    const crime = Array.isArray(props.crime) ? props.crime[0] : props.crime;
    const victim = Array.isArray(props.victims) ? props.victims[0] : props.victims;
    const perpetrator = Array.isArray(props.perpetrators) ? props.perpetrators[0] : props.perpetrators;
    const sources = Array.isArray(props.source) ? props.source : [];
    const city = props?.crime.crime_city || "Unbekannt";
    const subtitleParts = [props?.crime_date, city].filter(Boolean);

    const victimName = (victim?.firstname || victim?.lastname) ? `${victim?.firstname} ${victim?.lastname?.slice(0,1)}.` : "Unbekannt";
    const perpRelation = victim?.relationship_perpetrator_details ? `${victim?.relationship_perpetrator_details} des Opfers` : "Fremder"

  return (
    <article className="case-card">
      <p className="case-card-meta">{subtitleParts.join(" · ")}</p>
      <p className="case-card-description">
      Opfer: {victimName} ({victim?.age || "Unbekannt"})
      </p>

      <details className="case-details">
        <summary>Mehr Details</summary>
      <div className="case-details-content">
      <p className="case-details-row">
      Art des Femi(ni)zids: <b>{victim?.type_of_feminicide || "-"}</b>
      </p>
      <p className="case-details-row">
      Täter: {perpRelation} ({perpetrator?.age}) 
      </p>
        </div>
      </details>
    </article>
  );
};
