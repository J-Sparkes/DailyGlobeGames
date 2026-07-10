import type { Country } from "@/types/country";

export function getLandBorderIds(country: Country): string[] {
  return country.land_borders;
}

export function getMaritimeLinkIds(country: Country): string[] {
  return country.maritime_links;
}

/** Playable adjacency: land borders plus maritime ferry/air links. */
export function getLinkedCountryIds(country: Country): string[] {
  return [...new Set([...country.land_borders, ...country.maritime_links])];
}

export function hasCountryLink(from: Country, toCountryId: string): boolean {
  return (
    from.land_borders.includes(toCountryId) ||
    from.maritime_links.includes(toCountryId)
  );
}
