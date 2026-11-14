import Link from "next/link";
import { getReports } from "../../services/api";
import { formatDate } from "../caseFormat";

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
      <ul className="list-unstyled">
        {reports.map((report) => (
          <li key={report.documentId} className="mb-4">
            <Link href={`/reports/${report.documentId}`} className="purple fs-3 fw-bold text-decoration-none">
              {report.title}
            </Link>
            <p className="fs-5 mb-0">{formatDate(report.date)}</p>
          </li>
        ))}
      </ul>
    )}
  </main>
}
