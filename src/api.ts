import axios, { type AxiosResponse } from "axios";
import { DateTime } from "luxon";
import { computeWeight, localize } from "./geolocation.js";
import { capitalize } from "./utils.js";

type Auth = {
  expiresAt: string;
  accessToken: string;
};

type Paginated<T> = {
  first: string;
  items: T[];
  last: string;
  page: number;
  pages: number;
  self: string;
  size: number;
  total: number;
};

export const handlePagination = async <T, U extends Paginated<T>>(
  url: URL,
  call: (uriWithPagination: string) => Promise<AxiosResponse<U>>,
) => {
  const response = await call(url.toString());
  const { data } = response;

  if (data.pages === 1) {
    return response;
  }

  const result = await Promise.all(
    Array.from({ length: data.pages - 1 }, (_, index) => index + 2).map(async page => {
      url.searchParams.set("page", page.toString());
      return call(url.toString());
    }),
  );

  data.items = [...data.items, ...result.flatMap(r => r.data.items)];
  response.data = data;
  return response;
};

type City = {
  available: boolean;
  city: { names: { nl: string; fr: string; de: string; en: string } };
  names: Array<{ nl: string; fr: string; de: string; en: string }>;
  code: string;
  createdAt: string;
  id: string;
};

type Street = {
  id: string;
  name: string;
};

type Collection = {
  id: string;
  timestamp: string;
  type: string;
  fraction: {
    id: string;
    isDeleted: boolean;
    name: { nl: string; fr: string; en: string; de: string };
    national: boolean;
  };
};

type RecyPark = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  content: string;
  image: string;
  location: {
    lat: number;
    lon: number;
  };
  data: {
    id: number;
    tooltip: string;
  };
};

const recycleApi = "https://api.fostplus.be/recyclecms/app/v1";

// noinspection SpellCheckingInspection
const secret =
  "Op2tDi2pBmh1wzeC5TaN2U3knZan7ATcfOQgxh4vqC0mDKmnPP2qzoQusmInpglfIkxx8SZrasBqi5zgMSvyHggK9j6xCQNQ8xwPFY2o03GCcQfcXVOyKsvGWLze7iwcfcgk2Ujpl0dmrt3hSJMCDqzAlvTrsvAEiaSzC9hKRwhijQAFHuFIhJssnHtDSB76vnFQeTCCvwVB27DjSVpDmq8fWQKEmjEncdLqIsRnfxLcOjGIVwX5V0LBntVbeiBvcjyKF2nQ08rIxqHHGXNJ6SbnAmTgsPTg7k6Ejqa7dVfTmGtEPdftezDbuEc8DdK66KDecqnxwOOPSJIN0zaJ6k2Ye2tgMSxxf16gxAmaOUqHS0i7dtG5PgPSINti3qlDdw6DTKEPni7X0rxM";

export const login = async () => {
  const { data } = await axios.get<Auth>(`${recycleApi}/access-token`, {
    headers: {
      "X-Secret": secret,
      "X-Consumer": "recycleapp.be",
    },
  });
  return data.accessToken;
};

export const recycleService = (token: string) => ({
  async getPostalCodeId(code: number) {
    const url = new URL(`${recycleApi}/zipcodes`);
    url.searchParams.append("q", code.toString());

    const { data } = await handlePagination(url, async uriWithPagination =>
      axios.get<Paginated<City>>(uriWithPagination, {
        headers: {
          authorization: token,
          "X-Consumer": "recycleapp.be",
        },
      }),
    );

    return data.items.flatMap(city =>
      city.names.flatMap(name => ({
        label: city.code + " - " + name.fr,
        value: city.id + "#" + name.fr,
      })),
    );
  },

  async getStreetId(zipCodeId: string, street: string) {
    const url = new URL(`${recycleApi}/streets`);
    url.searchParams.append("q", street);
    url.searchParams.append("zipcodes", zipCodeId);

    const { data } = await handlePagination(url, async uriWithPagination =>
      axios.post<Paginated<Street>>(
        uriWithPagination,
        {},
        {
          headers: {
            authorization: token,
            "X-Consumer": "recycleapp.be",
          },
        },
      ),
    );

    return data.items.map(street => ({
      label: street.name,
      value: street.id,
    }));
  },

  // eslint-disable-next-line unicorn/prevent-abbreviations
  async listRecyparks(args: { postalCode: string; street: string; house: number }) {
    const address = `${args.street} ${args.house} ${args.postalCode}`;
    const { longitude, latitude } = await localize(address);

    const url = new URL("https://www.intradel.be/service/park/find");
    url.searchParams.append("lat", latitude.toString());
    url.searchParams.append("lon", longitude.toString());

    const { data } = await axios.get<RecyPark[]>(url.toString());

    console.log(data[0]);

    // Return recypark sort from nearest to farthest
    const weights = await Promise.all(
      data.map(async item =>
        computeWeight({ latitude, longitude }, { latitude: item.lat, longitude: item.lng }),
      ),
    );

    return data
      .map((item, index) => ({ ...item, weight: weights[index]! }))
      .sort((a, b) => a.weight - b.weight);
  },

  // eslint-disable-next-line unicorn/prevent-abbreviations
  async getRecypark(args: { postalCode: string; street: string; house: number }) {
    const recyparks = await this.listRecyparks(args);
    const recypark = recyparks.at(0);

    if (recypark) {
      const name = capitalize(recypark.name);
      return {
        latitude: recypark.lat,
        longitude: recypark.lng,
        name,
      };
    }

    return undefined;
  },

  // eslint-disable-next-line unicorn/prevent-abbreviations
  async getCalendar(args: { postalCode: string; street: string; house: number; address: string }) {
    const url = new URL(`${recycleApi}/collections`);
    url.searchParams.append("zipcodeId", args.postalCode);
    url.searchParams.append("streetId", args.street);
    url.searchParams.append("houseNumber", args.house.toString());
    url.searchParams.append("fromDate", DateTime.now().startOf("year").toISODate());
    url.searchParams.append(
      "untilDate",
      DateTime.now().plus({ year: 1 }).startOf("year").toISODate(),
    );
    url.searchParams.append("size", "200");

    const { data } = await handlePagination(url, async uriWithPagination =>
      axios.get<Paginated<Collection>>(uriWithPagination, {
        headers: {
          authorization: token,
          "X-Consumer": "recycleapp.be",
        },
      }),
    );

    const items = data.items
      .filter(collection => !collection.fraction.isDeleted)
      .map(collection => ({
        label: collection.fraction.name.fr,
        value: collection.id,
        timestamp: new Date(collection.timestamp),
        address: args.address,
      }));

    return groupItemsPerDay(items);
  },
});

export const groupItemsPerDay = <T extends { timestamp: Date }>(items: T[]): T[][] => {
  const map = new Map<string, typeof items>();

  for (const item of items) {
    const key = item.timestamp.toString();
    const value = map.get(key);
    if (value) {
      map.set(key, [...value, item]);
    } else {
      map.set(key, [item]);
    }
  }

  return [...map.values()];
};
