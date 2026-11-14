import Link from "next/link";
import "./reports.css";
import { getReports } from "../../services/api";
import { formatDate, teaser } from "../caseFormat";

export default async function Page() {
  let reports = [];

  try {
    reports = await getReports();
  } catch (error) {
    console.error("Failed to load reports", error);
  }

  return <main>
    <h1 className="purple display-1 fw-bold">Reports</h1>
    {reports.length === 0 ? (
      <p className="fs-3">No reports available yet.</p>
    ) : (
      <ul className="list-unstyled report-list">
        {reports.map((report) => (
          <li key={report.documentId} className="report-card">
            <div className="report-meta">
              <span className="report-date">{formatDate(report.date)}</span>
            </div>
            <Link href={`/reports/${report.documentId}`} className="purple fs-3 fw-bold text-decoration-none report-title">
              {report.title}
            </Link>
            {teaser(report.content) && <p className="fs-5 report-teaser">{teaser(report.content)}</p>}
          </li>
        ))}
      </ul>
    )}
  </main>
}
