const CASES_URL = process.env.NEXT_PUBLIC_CASES_URL || "https://api.feminizidmap.org/cases";

export async function getCases(params = {}) {
  const url = new URL(CASES_URL);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Filtering on the map happens client-side, so every case has to be loaded.
// If the API paginates (Strapi-style meta.pagination), fetch the remaining pages.
export async function getAllCases({ pageSize = 1000 } = {}) {
  const first = await getCases({ "pagination[page]": 1, "pagination[pageSize]": pageSize });
  const pageCount = first?.meta?.pagination?.pageCount ?? 1;
  if (pageCount <= 1) {
    return first;
  }

  const rest = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, i) =>
      getCases({ "pagination[page]": i + 2, "pagination[pageSize]": pageSize })
    )
  );

  return {
    ...first,
    data: [...(first.data ?? []), ...rest.flatMap((page) => page.data ?? [])],
  };
}
