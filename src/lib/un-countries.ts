import unCountryData from "@/data/un-countries.json";

export type UnCountry = {
  id: string;
  name: string;
  officialName: string;
  iso2: string;
  iso3: string;
  capital: string;
  lat: number;
  lng: number;
  region: string;
  subregion: string;
  landlocked: boolean;
  borders: number;
  aliases: string[];
  unStatus: "member" | "observer" | "associated";
  inSweepPool: boolean;
};

const dataset = unCountryData as {
  meta: { count: number; note: string };
  countries: UnCountry[];
};

export const unCountries: UnCountry[] = dataset.countries;

export const unCountryById = new Map(
  unCountries.map((country) => [country.id, country]),
);

export const UN_COUNTRY_COUNT = dataset.meta.count;
