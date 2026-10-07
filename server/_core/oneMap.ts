import { ENV } from "./env";

// OneMap (Singapore Land Authority) — free geocoding + driving routes.
// Docs: https://www.onemap.gov.sg/apidocs/

const BASE_URL = "https://www.onemap.gov.sg/api";
const REQUEST_TIMEOUT_MS = 8_000;
// Fetch a fresh token this long before the current one expires.
const RENEW_MARGIN_S = 60 * 60;
// Straight-line distance understates what a car drives; used only when routing fails.
const ROAD_FACTOR = 1.35;

export interface LatLng {
  lat: number;
  lng: number;
}

export interface DrivingDistance {
  km: number;
  /** True when routing was unavailable and the distance is a straight-line estimate. */
  estimated: boolean;
}

type CachedToken = { value: string; exp: number };

let cachedToken: CachedToken | null = null;
let loginInFlight: Promise<CachedToken | null> | null = null;
const geocodeCache = new Map<string, LatLng>();

function nowSeconds(): number {
  return Date.now() / 1000;
}

function jwtExpiry(token: string): number {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
    return Number(payload.exp) || 0;
  } catch {
    return 0;
  }
}

async function loginForToken(): Promise<CachedToken | null> {
  try {
    const res = await fetch(`${BASE_URL}/auth/post/getToken`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: ENV.oneMapEmail, password: ENV.oneMapPassword }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { access_token?: string; expiry_timestamp?: string | number };
    if (!data.access_token) throw new Error("no access_token in response");
    const exp = jwtExpiry(data.access_token) || Number(data.expiry_timestamp) || nowSeconds() + 2 * 24 * 3600;
    return { value: data.access_token, exp };
  } catch (error) {
    console.error("OneMap token request failed:", (error as Error).message);
    return null;
  }
}

/**
 * A valid OneMap API token, or null if none is available. Tokens last 3 days,
 * so with ONEMAP_EMAIL / ONEMAP_PASSWORD set the server renews them itself;
 * a plain ONEMAP_TOKEN works only until it expires.
 */
async function getToken(forceRefresh = false): Promise<string | null> {
  const now = nowSeconds();
  if (!forceRefresh && cachedToken && cachedToken.exp - now > RENEW_MARGIN_S) return cachedToken.value;

  if (ENV.oneMapEmail && ENV.oneMapPassword) {
    loginInFlight ??= loginForToken().finally(() => {
      loginInFlight = null;
    });
    const fresh = await loginInFlight;
    if (fresh) {
      cachedToken = fresh;
      return fresh.value;
    }
  }

  if (ENV.oneMapToken && !forceRefresh) {
    const exp = jwtExpiry(ENV.oneMapToken);
    if (exp > now) {
      cachedToken = { value: ENV.oneMapToken, exp };
      return ENV.oneMapToken;
    }
  }

  return cachedToken && cachedToken.exp > now ? cachedToken.value : null;
}

async function oneMapGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

  for (let attempt = 0; ; attempt++) {
    const token = await getToken(attempt > 0);
    const res = await fetch(url, {
      headers: token ? { Authorization: token } : {},
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    // Expired/revoked token: renew once and retry.
    if ((res.status === 401 || res.status === 403) && attempt === 0) continue;
    if (!res.ok) throw new Error(`OneMap request failed (${res.status}) for ${path}`);
    return (await res.json()) as T;
  }
}

function postalCodeOf(address: string): string | null {
  const matches = address.match(/\b\d{6}\b/g);
  return matches ? matches[matches.length - 1] : null;
}

/** Looks an address up by its postal code (exact), falling back to the full text. */
export async function geocode(address: string): Promise<LatLng> {
  const key = address.trim().toLowerCase();
  const cached = geocodeCache.get(key);
  if (cached) return cached;

  const postal = postalCodeOf(address);
  for (const searchVal of postal ? [postal, address] : [address]) {
    const data = await oneMapGet<{ results?: { POSTAL?: string; LATITUDE: string; LONGITUDE: string }[] }>(
      "/common/elastic/search",
      { searchVal, returnGeom: "Y", getAddrDetails: "Y", pageNum: "1" }
    );
    const results = data.results ?? [];
    const hit = (postal && results.find((r) => r.POSTAL === postal)) || (searchVal === address ? results[0] : undefined);
    if (hit) {
      const point = { lat: Number(hit.LATITUDE), lng: Number(hit.LONGITUDE) };
      if (geocodeCache.size > 500) geocodeCache.clear();
      geocodeCache.set(key, point);
      return point;
    }
  }
  throw new Error(`Address not found: ${address}`);
}

function straightLineKm(a: LatLng, b: LatLng): number {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/** Driving distance between two addresses; a straight-line estimate if routing is unavailable. */
export async function drivingDistance(fromAddress: string, toAddress: string): Promise<DrivingDistance> {
  const [from, to] = await Promise.all([geocode(fromAddress), geocode(toAddress)]);

  try {
    const route = await oneMapGet<{ status?: number; route_summary?: { total_distance?: number } }>(
      "/public/routingsvc/route",
      { start: `${from.lat},${from.lng}`, end: `${to.lat},${to.lng}`, routeType: "drive" }
    );
    const meters = route.route_summary?.total_distance;
    if (route.status !== 0 || typeof meters !== "number") throw new Error("no route found");
    return { km: meters / 1000, estimated: false };
  } catch (error) {
    console.warn("OneMap routing unavailable, using a straight-line estimate:", (error as Error).message);
    return { km: straightLineKm(from, to) * ROAD_FACTOR, estimated: true };
  }
}

/** Test hook: forget cached tokens and locations. */
export function resetOneMapCache(): void {
  cachedToken = null;
  loginInFlight = null;
  geocodeCache.clear();
}
