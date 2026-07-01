import type { Feature, Geometry } from "geojson";
import { feature } from "topojson-client";
import type {
  GeometryCollection,
  Topology,
} from "topojson-specification";
import { toCountryId } from "@/lib/country-id";
import { registerMapCountry } from "@/lib/country-resolve";

export type CountryFeature = Feature<
  Geometry,
  { name: string; countryId: string }
>;

let cache: CountryFeature[] | null = null;
let loadPromise: Promise<CountryFeature[]> | null = null;

export async function loadCountryFeatures(): Promise<CountryFeature[]> {
  if (cache) return cache;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const response = await fetch("/world-countries-110m.json");
    const topo = (await response.json()) as Topology<{
      countries: GeometryCollection;
    }>;

    const collection = feature(topo, topo.objects.countries);

    cache = collection.features.flatMap((entry) => {
      const props = entry.properties as { name?: string } | null;
      const name = props?.name;
      if (typeof name !== "string") return [];

      const countryId = toCountryId(name);
      registerMapCountry(name, countryId);

      return [
        {
          ...entry,
          properties: { name, countryId },
        } satisfies CountryFeature,
      ];
    });

    return cache;
  })();

  return loadPromise;
}
