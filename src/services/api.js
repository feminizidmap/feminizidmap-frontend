const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.feminizidmap.org";

export async function getCases() {
  const response = await fetch(`${API_URL}/cases`);

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
