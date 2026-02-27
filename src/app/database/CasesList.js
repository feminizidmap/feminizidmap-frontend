"use client"

import { useMemo } from 'react';
import CaseDetails from '../CaseDetails';

function sortCasesByDateDesc(caseList) {
  return [...caseList].sort((a, b) => {
    const dateA = Date.parse(a?.crime_date || "");
    const dateB = Date.parse(b?.crime_date || "");
    if (!Number.isFinite(dateA) && !Number.isFinite(dateB)) return 0;
    if (!Number.isFinite(dateA)) return 1;
    if (!Number.isFinite(dateB)) return -1;
    return dateB - dateA;
  });
}

export default function CasesList({ cases }) {
  const caseItems = cases?.data || [];
  const sorted = useMemo(() => sortCasesByDateDesc(caseItems), [caseItems]);

  return (
    <div className="database-layout">
      <div className="database-header">
        <p className="cases-list-kicker">Datenbank</p>
        <h2 className="cases-list-title">{sorted.length} Faelle</h2>
      </div>
      <div className="database-scroll">
        {sorted.map((caseItem) => (
          <CaseDetails key={caseItem.id} props={caseItem} />
        ))}
      </div>
    </div>
  );
}
