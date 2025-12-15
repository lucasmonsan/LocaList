import type { OSMProperties, PlaceType } from '$lib/types/osm.types';
import { i18n } from '$lib/i18n/i18n.svelte';

export const getPlaceLabel = (properties: OSMProperties): string => {
  const { osm_key, osm_value } = properties;
  const key = `${osm_key}:${osm_value}`;

  // Busca no dicionário i18n
  const label = i18n.t.places[key];

  if (label) return label;

  // Fallback: formata o osm_value
  return osm_value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char: string) => char.toUpperCase());
};

export const getPlaceType = (properties: OSMProperties): PlaceType => {
  const areas = [
    'city',
    'town',
    'village',
    'suburb',
    'neighbourhood',
    'park',
    'administrative',
    'residential',
    'industrial',
    'commercial'
  ];

  const { osm_value, osm_key } = properties;

  if (areas.includes(osm_value) || osm_key === 'landuse' || osm_key === 'boundary') {
    return 'area';
  }

  return 'point';
};