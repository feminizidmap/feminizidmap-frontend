const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://feminizidmap-backend.onrender.com";
const API_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN;

function unwrapEntity(entity) {
  if (!entity) {
    return entity;
  }

  if (entity.attributes) {
    return {
      id: entity.id,
      ...entity.attributes,
    };
  }

  return entity;
}

function unwrapRelation(relation) {
  if (relation === null) {
    return null;
  }

  if (relation === undefined) {
    return undefined;
  }

  if (Array.isArray(relation)) {
    return relation.map(unwrapEntity);
  }

  if (typeof relation === "object" && "data" in relation) {
    if (relation.data === null) {
      return null;
    }

    if (Array.isArray(relation.data)) {
      return relation.data.map(unwrapEntity);
    }

    return unwrapEntity(relation.data);
  }

  return unwrapEntity(relation);
}

function normalizeCase(rawCase) {
  const currentCase = unwrapEntity(rawCase);

  if (!currentCase || typeof currentCase !== "object") {
    return rawCase;
  }

  return {
    ...currentCase,
    address: unwrapRelation(currentCase.address) ?? null,
    crime: unwrapRelation(currentCase.crime) ?? null,
    source: unwrapRelation(currentCase.source) ?? [],
    perpetrator: unwrapRelation(currentCase.perpetrator) ?? [],
    victim: unwrapRelation(currentCase.victim) ?? [],
    authorities_involved: unwrapRelation(currentCase.authorities_involved) ?? [],
    media_labels: unwrapRelation(currentCase.media_labels) ?? [],
    media_labels_used: unwrapRelation(currentCase.media_labels_used) ?? [],
    comments: unwrapRelation(currentCase.comments) ?? [],
    report_of_crime: unwrapRelation(currentCase.report_of_crime) ?? null,
  };
}

async function fetchWithAuth(endpoint, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (API_TOKEN) {
    headers.Authorization = `Bearer ${API_TOKEN}`;
  }

  const hasPopulate = /[?&]populate=/.test(endpoint);
  const separator = endpoint.includes("?") ? "&" : "?";
  const url = `${API_URL}${endpoint}${hasPopulate ? "" : `${separator}populate=*`}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();

  if (Array.isArray(payload?.data)) {
    return {
      ...payload,
      data: payload.data.map(normalizeCase),
    };
  }

  return payload;
}

export async function getCasesPublic() {
  return fetchWithAuth("/api/cases-public");
}

export async function getCases(options = {}) {
  const { populate = "deep", pageSize = 100000 } = options;
  return fetchWithAuth(`/api/cases?populate=${populate}&pagination[pageSize]=${pageSize}`);
}
