import axios from "axios";
import axiosRetry from "axios-retry";

axiosRetry(axios, {
  retries: 3,
  retryDelay() {
    return 1000;
  },
});

export type OpenStreetMapResult = {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
  icon: string;
  place_rank: number;
  addresstype: string;
  name: string;
  address: {
    road: string;
    // cSpell:disable
    neighbourhood: string;
    suburb: string;
    city: string;
    municipality: string;
    county: string;
    state: string;
    region: string;
    postcode: string;
    country: string;
    country_code: string;
  };
  boundingbox: string[];
};

export const localize = async (address: string) => {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.append("addressdetails", "1");
  url.searchParams.append("q", address);
  url.searchParams.append("format", "json");

  const { data } = await axios.get<OpenStreetMapResult[]>(url.toString());

  if (data.length === 0 || !data[0]) {
    // cSpell:disable
    throw new Error("Address not found using Nominatim OpenStreetMap API.");
  }

  return {
    longitude: Math.floor(Number.parseFloat(data[0].lon) * 1000) / 1000,
    latitude: Math.floor(Number.parseFloat(data[0].lat) * 1000) / 1000,
  };
};

type Route = {
  code: string;
  routes: Array<{
    geometry: string;
    weight_name: string;
    weight: number;
    duration: number;
    distance: number;
  }>;
};

export const computeWeight = async (
  start: { latitude: number; longitude: number },
  end: typeof start,
): Promise<number> => {
  // prettier-ignore
  const url = new URL(`https://routing.openstreetmap.de/routed-car/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}`);
  url.searchParams.append("overview", "false");
  url.searchParams.append("alternatives", "false");
  url.searchParams.append("steps", "false");

  const { data } = await axios.get<Route>(url.toString(), {});

  if (!data?.routes) {
    // cSpell:disable
    throw new Error(
      `Unable to find a route using OpenStreetMap routing API using the given coordinates: ${start.longitude},${start.latitude};${end.longitude},${end.latitude}`,
    );
  }

  const { duration, distance, weight } = data.routes[0]!;
  return duration + distance + weight;
};
