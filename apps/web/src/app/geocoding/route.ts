type PhotonFeature = {
  properties: {
    osm_type?: string;
    osm_id?: number;
    osm_key?: string;
    osm_value?: string;
    name?: string;
    city?: string;
    locality?: string;
    district?: string;
    county?: string;
    state?: string;
    country?: string;
    countrycode?: string;
    street?: string;
    housenumber?: string;
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

async function searchPhoton(query: string, scope: "city" | "place", latitude?: number, longitude?: number, city?: string) {
  const previous = requestQueue;
  let release = () => {};
  requestQueue = new Promise<void>((resolve) => { release = resolve; });
  await previous;

  try {
    const providerQuery = scope === "place" && city ? `${query} ${city}` : query;
    const params = new URLSearchParams({ q: providerQuery, limit: "20", lang: "en" });
    if (latitude !== undefined && longitude !== undefined && Number.isFinite(latitude) && Number.isFinite(longitude)) {
      params.set("lat", String(latitude));
      params.set("lon", String(longitude));
      params.set("zoom", "12");
      params.set("location_bias_scale", "0.1");
    }
    const response = await fetch(`https://photon.komoot.io/api/?${params}`, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Geocoding provider returned ${response.status}`);

    const body = await response.json() as { features?: PhotonFeature[] };
    const placeTypes = new Set(["city", "town", "village", "hamlet", "municipality"]);
    const features = (body.features ?? [])
      .filter((feature) => scope === "place" || (feature.properties.osm_key === "place" && placeTypes.has(feature.properties.osm_value ?? "")))
      .filter((feature) => feature.properties.name && Number.isFinite(feature.geometry.coordinates[0]) && Number.isFinite(feature.geometry.coordinates[1]));

    if (scope === "place") {
      const normalizedQuery = query.toLocaleLowerCase("en");
      const normalizedCity = city?.toLocaleLowerCase("en");
      const landmarkKeys = new Set(["amenity", "historic", "leisure", "man_made", "natural", "tourism"]);
      const score = (feature: PhotonFeature) => {
        const properties = feature.properties;
        const name = properties.name?.toLocaleLowerCase("en") ?? "";
        let value = properties.city?.toLocaleLowerCase("en") === normalizedCity ? 100 : 0;
        if (landmarkKeys.has(properties.osm_key ?? "")) value += 40;
        if (name === normalizedQuery) value += 100;
        if (name.endsWith(normalizedQuery)) value += 10;
        return value - name.split(/\s+/).length;
      };
      features.sort((left, right) => score(right) - score(left));
    }

    return features.slice(0, 10)
      .map((feature) => {
        const properties = feature.properties;
        const [longitude, latitude] = feature.geometry.coordinates;
        const region = properties.state ?? properties.county ?? properties.district ?? properties.city ?? "";
        return {
          id: `${properties.osm_type ?? "place"}-${properties.osm_id ?? `${latitude}-${longitude}`}`,
          city: properties.name!,
          region,
          country: properties.country ?? "",
          countryCode: properties.countrycode ?? "",
          formattedName: formattedName([properties.name, properties.housenumber, properties.street, properties.locality, properties.district, properties.city, properties.county, properties.state, properties.country]),
          latitude,
          longitude,
        };
      });
  } finally {
    release();
  }
}

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const query = searchParams.get("q")?.trim() ?? "";
  const scope = searchParams.get("scope") === "place" ? "place" : "city";
  const city = searchParams.get("city")?.trim() || undefined;
  const latitudeParam = searchParams.get("lat");
  const longitudeParam = searchParams.get("lon");
  const latitude = latitudeParam === null ? undefined : Number(latitudeParam);
  const longitude = longitudeParam === null ? undefined : Number(longitudeParam);
  if (query.length < 2 || query.length > 160) {
    return Response.json({ message: "Enter at least two characters to find a city." }, { status: 400 });
  }

  const cacheKey = [scope, query.toLocaleLowerCase("en"), city?.toLocaleLowerCase("en") ?? "", latitude !== undefined && Number.isFinite(latitude) ? latitude.toFixed(3) : "", longitude !== undefined && Number.isFinite(longitude) ? longitude.toFixed(3) : ""].join(":");
  try {
    let places = resultCache.get(cacheKey);
    if (!places) {
      places = await searchPhoton(query, scope, latitude, longitude, city);
      resultCache.set(cacheKey, places);
    }
    return Response.json({ places }, { headers: { "Cache-Control": "public, max-age=86400" } });
  } catch {
    return Response.json({ message: "City search is temporarily unavailable. Please try again." }, { status: 502 });
  }
}
