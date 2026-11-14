import { notFound } from "next/navigation";
import BlocksContent from "../../BlocksContent";
import { getReport, getReports } from "../../../services/api";
import { formatDate } from "../../caseFormat";

export async function generateStaticParams() {
  let reports = [];

  try {
    reports = await getReports();
  } catch (error) {
    console.error("Failed to load reports", error);
  }

  // output: 'export' requires at least one static path per dynamic route, even
  // when there are no reports yet; this id never matches a real document and
  // falls through to notFound() below.
  if (reports.length === 0) {
    return [{ documentId: "none" }];
  }

  return reports.map((report) => ({ documentId: report.documentId }));
}

export default async function Page({ params }) {
  let report = null;

  try {
    report = await getReport(params.documentId);
  } catch (error) {
    console.error("Failed to load report", error);
  }

  if (!report) {
    notFound();
  }

  return <main>
    <h1 className="purple display-1 fw-bold">{report.title}</h1>
    <p className="fs-5">{formatDate(report.date)}</p>
    <BlocksContent content={report.content} />
  </main>
}
