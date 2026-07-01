export interface Country {
  id: string;
  name: string;
  mapName: string;
  aliases: string[];
  neighbors: string[];
  inDailyPool: boolean;
  iso3166Alpha2?: string;
}

export interface CountryDataset {
  version: string;
  updatedAt?: string;
  countries: Country[];
}
