const CASES_URL = process.env.NEXT_PUBLIC_CASES_URL || "https://api.feminizidmap.org/cases";
const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "https://api.feminizidmap.org";

export async function getCases() {
  const response = await fetch(CASES_URL);

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function getSingleTypeContent(endpoint) {
  const response = await fetch(`${STRAPI_URL}${endpoint}`);

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const { data } = await response.json();

  return data?.content ?? null;
}

export function getHome() {
  return getSingleTypeContent("/api/home");
}

export function getAbout() {
  return getSingleTypeContent("/api/about");
}

export async function getReports() {
  const response = await fetch(`${STRAPI_URL}/api/reports?sort=date:desc&pagination[pageSize]=100`);

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const { data } = await response.json();

  return data ?? [];
}

export async function getReport(documentId) {
  const response = await fetch(`${STRAPI_URL}/api/reports/${documentId}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const { data } = await response.json();

  return data ?? null;
}
