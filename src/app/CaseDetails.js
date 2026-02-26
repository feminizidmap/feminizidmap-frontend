export default function CaseDetails({ props }) {
  const crime = Array.isArray(props.crime) ? props.crime[0] : props.crime;
  const sources = Array.isArray(props.source) ? props.source : [];

  return (
    <div className="mb-5">
      <h3 className="mb-3">{props.crime_date} {props.address?.city}</h3>
      <p className="fs-5">{crime?.description_of_crimescene}</p>

      <details>
        <summary><b>Mehr Details</b></summary>
        <div className="mt-4">
          <p className="fs-5">Todesursache: <b>{crime?.cause_of_death?.label}</b></p>
          <p className="fs-5">Typ: <b>{crime?.type_of_feminicide?.label}</b></p>
          <p className="fs-5">Tatwaffe: <b>{crime?.weapon_details}</b></p>
          <p className="fs-5">Detaillierter Ort: <b>{crime?.location_details}</b></p>
          <p className="fs-5">Quellen:</p>
          <ul>
            {sources.map((s) => (
              <li key={s.id}>
                <a href={s.url} target="_blank">{s.url}</a>
              </li>
            ))}
          </ul>
        </div>
      </details>
    </div>
  );
};
