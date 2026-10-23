type PhotonFeature = {
  properties: {
    osm_type?: string;
    osm_id?: number;
    osm_key?: string;
    osm_value?: string;
    name?: string;
    city?: string;
    county?: string;
    state?: string;
    country?: string;
    countrycode?: string;
  };
  geometry: {
    coordinates: [number, number];
  };
};

type PlaceResult = {
  id: string;
  city: string;
  region: string;
  country: string;
  countryCode: string;
  formattedName: string;
  latitude: number;
  longitude: number;
};

const resultCache = new Map<string, PlaceResult[]>();
let requestQueue: Promise<void> = Promise.resolve();

function formattedName(parts: Array<string | undefined>) {
  return parts.filter((part, index, all): part is string => Boolean(part) && all.indexOf(part) === index).join(", ");
}

async function searchPhoton(query: string) {
  const previous = requestQueue;
  let release = () => {};
  requestQueue = new Promise<void>((resolve) => { release = resolve; });
  await previous;

  try {
    const params = new URLSearchParams({ q: query, limit: "10", lang: "en" });
    const response = await fetch(`https://photon.komoot.io/api/?${params}`, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Geocoding provider returned ${response.status}`);

    const body = await response.json() as { features?: PhotonFeature[] };
    const placeTypes = new Set(["city", "town", "village", "hamlet", "municipality"]);
    return (body.features ?? [])
      .filter((feature) => feature.properties.osm_key === "place" && placeTypes.has(feature.properties.osm_value ?? ""))
      .filter((feature) => feature.properties.name && Number.isFinite(feature.geometry.coordinates[0]) && Number.isFinite(feature.geometry.coordinates[1]))
      .map((feature) => {
        const properties = feature.properties;
        const [longitude, latitude] = feature.geometry.coordinates;
        const region = properties.state ?? properties.county ?? properties.city ?? "";
        return {
          id: `${properties.osm_type ?? "place"}-${properties.osm_id ?? `${latitude}-${longitude}`}`,
          city: properties.name!,
          region,
          country: properties.country ?? "",
          countryCode: properties.countrycode ?? "",
          formattedName: formattedName([properties.name, properties.county, properties.state, properties.country]),
          latitude,
          longitude,
        };
      });
  } finally {
    release();
  }
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2 || query.length > 160) {
    return Response.json({ message: "Enter at least two characters to find a city." }, { status: 400 });
  }

  const cacheKey = query.toLocaleLowerCase("en");
  try {
    let places = resultCache.get(cacheKey);
    if (!places) {
      places = await searchPhoton(query);
      resultCache.set(cacheKey, places);
    }
    return Response.json({ places }, { headers: { "Cache-Control": "public, max-age=86400" } });
  } catch {
    return Response.json({ message: "City search is temporarily unavailable. Please try again." }, { status: 502 });
  }
}
