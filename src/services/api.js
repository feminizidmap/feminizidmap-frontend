const CASES_URL = process.env.NEXT_PUBLIC_CASES_URL || "https://api.feminizidmap.org/cases";

export async function getCases() {
  const response = await fetch(CASES_URL);

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
