"use client"

import { Row, Col } from 'react-bootstrap';
import { useState } from 'react';
import CaseDetails from '../CaseDetails';

export default function CasesList({ cases }) {
  const [activeCase, setActiveCase] = useState(null);
  const caseItems = cases?.data || [];

  const CaseCard = ({ c }) => {
    const activeClass = activeCase && activeCase.id === c.id ? "active" : "";

    return <div onClick={() => setActiveCase(c)}>
      <div className={"case-card p-3 my-3 d-flex flex-column align-items-center justify-content-center " + activeClass}>
        <div>{c.crime_date}</div>
        <h2 className="fs-3">{c.address?.city || "Unknown location"}</h2>
      </div>
    </div>
  }

  return <Row>
    <Col xs={12} md={5} style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 350px)' }}>
      {caseItems.map((c) => (
        <CaseCard key={c.id} c={c} />
      ))}
    </Col>
    <Col xs={12} md={7}>
      {activeCase && <div className="mt-3 ms-md-4">
        <CaseDetails props={activeCase} />
      </div>}
    </Col>
  </Row>
}
