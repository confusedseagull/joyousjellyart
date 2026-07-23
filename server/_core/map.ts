import { ENV } from "./env";

export type DistanceMatrixResult = {
  rows: Array<{
    elements: Array<{
      distance: { text: string; value: number };
      duration: { text: string; value: number };
      status: string;
    }>;
  }>;
  origin_addresses: string[];
  destination_addresses: string[];
  status: string;
};

export async function getDistanceMatrix(
  origins: string,
  destinations: string
): Promise<DistanceMatrixResult> {
  if (!ENV.googleMapsApiKey) {
    throw new Error("Google Maps credentials missing: set GOOGLE_MAPS_API_KEY");
  }

  const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
  url.searchParams.set("origins", origins);
  url.searchParams.set("destinations", destinations);
  url.searchParams.set("units", "metric");
  url.searchParams.set("key", ENV.googleMapsApiKey);

  const response = await fetch(url.toString());

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Google Maps API request failed (${response.status} ${response.statusText}): ${errorText}`
    );
  }

  return (await response.json()) as DistanceMatrixResult;
}
