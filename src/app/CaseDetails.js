export default function CaseDetails({ props }) {
  const crime = Array.isArray(props.crime) ? props.crime[0] : props.crime;
  const sources = Array.isArray(props.source) ? props.source : [];
  const city = props?.crime_geolocation_city || props?.address?.city || "Unknown";
  const subtitleParts = [props?.crime_date, city].filter(Boolean);

  return (
    <article className="case-card">
      <p className="case-card-meta">{subtitleParts.join(" · ")}</p>
      <p className="case-card-description">
        {crime?.description_of_crimescene || "Keine Kurzbeschreibung verfuegbar."}
      </p>

      <details className="case-details">
        <summary>Mehr Details</summary>
        <div className="case-details-content">
          <p className="case-details-row">
            Todesursache: <b>{crime?.cause_of_death?.label || "-"}</b>
          </p>
          <p className="case-details-row">
            Typ: <b>{crime?.type_of_feminicide?.label || "-"}</b>
          </p>
          <p className="case-details-row">
            Tatwaffe: <b>{crime?.weapon_details || "-"}</b>
          </p>
          <p className="case-details-row">
            Detaillierter Ort: <b>{crime?.location_details || crime?.crime_address_details || "-"}</b>
          </p>
          <p className="case-details-row mb-2">Quellen:</p>
          <ul className="case-sources">
            {sources.map((s) => (
              <li key={s.id}>
                <a href={s.url} target="_blank" rel="noopener noreferrer">
                  {s.url}
                </a>
              </li>
            ))}
          </ul>
          {sources.length === 0 && <p className="case-details-row">Keine Quellen hinterlegt.</p>}
        </div>
      </details>
    </article>
  );
};
