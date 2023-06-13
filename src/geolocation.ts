import axios from "axios";
import axiosRetry from "axios-retry";
import nodeGeoCoder from "node-geocoder";

const geocoder = nodeGeoCoder({
  provider: "openstreetmap",
});

export const localize = async (address: string) => {
  const result = await geocoder.geocode(address);
  return result[0]!;
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

// @ts-expect-error because axios-retry use ESM and does not declare correctly the default export in package.json
axiosRetry(axios, { retries: 3 });

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
  const { duration, distance, weight } = data.routes[0]!;
  return duration + distance + weight;
};
