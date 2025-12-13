import type { OSMFeature, PhotonResponse } from '$lib/types/osm.types';
import type { CacheItem } from '$lib/types/search.types';
import { mapState } from '../map/map.svelte';
import { API } from '$lib/constants/api';
import { CACHE_CONFIG, SEARCH_CONFIG } from '$lib/constants/config';

class SearchState {
  query = $state('');
  focused = $state(false);
  loading = $state(false);
  results = $state<OSMFeature[]>([]);
  hasSearched = $state(false);

  lastSearchedQuery = $state('');
  private isResultSelected = false;

  constructor() {
    this.cleanOldCache();
  }

  clear() {
    this.query = '';
    this.results = [];
    this.hasSearched = false;
    this.isResultSelected = false;
    this.lastSearchedQuery = '';
  }

  setQuery(value: string) {
    this.query = value;
    this.isResultSelected = false;
    this.hasSearched = false;

    if (value.length > SEARCH_CONFIG.MIN_QUERY_LENGTH - 1) {
      const localResults = this.searchInCache(value);
      if (localResults && localResults.length > 0) {
        this.results = localResults;
        this.hasSearched = true;
      }
    } else {
      this.results = [];
    }
  }

  async search() {
    if (!this.query.trim()) return;
    if (this.query === this.lastSearchedQuery) return;
    if (this.isResultSelected) return;

    this.loading = true;
    this.hasSearched = false;

    try {
      // Tenta cache exato primeiro
      const cached = this.getFromCache(this.query);
      if (cached) {
        this.results = cached;
        this.finishSearch();
        return;
      }

      const center = mapState.getCenter();
      const params = new URLSearchParams({
        q: this.query,
        limit: String(API.RESULT_LIMIT),
        lang: API.DEFAULT_LANG
      });

      if (center && typeof center.lat === 'number' && typeof center.lng === 'number') {
        params.append('lat', String(center.lat));
        params.append('lon', String(center.lng));
      }

      const url = `${API.PHOTON_BASE_URL}?${params}`;
      const response = await fetch(url);

      if (!response.ok) {
        if (url.includes(`&lang=${API.DEFAULT_LANG}`)) {
          const fallbackParams = new URLSearchParams(params);
          fallbackParams.delete('lang');
          const fallbackUrl = `${API.PHOTON_BASE_URL}?${fallbackParams}`;
          const fallbackResponse = await fetch(fallbackUrl);

          if (fallbackResponse.ok) {
            const data: PhotonResponse = await fallbackResponse.json();
            this.processResults(data);
            return;
          }
        }
        this.results = [];
        return;
      }

      const data: PhotonResponse = await response.json();
      this.processResults(data);

    } catch (error) {
      this.results = [];
    } finally {
      this.finishSearch();
    }
  }

  private processResults(data: PhotonResponse) {
    if (!data || !data.features) {
      this.results = [];
    } else {
      const uniqueResults = this.filterDuplicates(data.features);
      const finalResults = uniqueResults.slice(0, SEARCH_CONFIG.MAX_DISPLAYED_RESULTS);
      this.results = finalResults;
      this.saveToCache(this.query, finalResults);
    }
  }

  selectResult(result: OSMFeature) {
    const label = result.properties.name;
    this.query = label;
    this.lastSearchedQuery = label;
    this.isResultSelected = true;
    this.results = [];
    this.focused = false;

    mapState.selectLocation(result);
  }

  private finishSearch() {
    this.loading = false;
    this.hasSearched = true;
    this.lastSearchedQuery = this.query;
  }

  private normalizeStr(str: string | undefined): string {
    return str ? str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : '';
  }

  private filterDuplicates(features: OSMFeature[]): OSMFeature[] {
    if (!Array.isArray(features)) return [];

    const seenIds = new Set<number>();
    const seenKeys = new Set<string>();

    return features.filter((feature) => {
      const p = feature.properties;

      if (p.country === 'Brazil') p.country = 'Brasil';

      if (p.osm_id) {
        if (seenIds.has(p.osm_id)) return false;
        seenIds.add(p.osm_id);
      }

      let uniqueKey = '';
      const name = this.normalizeStr(p.name);
      const city = this.normalizeStr(p.city);
      const street = this.normalizeStr(p.street);

      if (p.osm_key === 'highway') {
        uniqueKey = `street|${name}|${city}`;
      } else {
        uniqueKey = `poi|${name}|${city}|${street}`;
      }

      if (!name) return true;

      if (seenKeys.has(uniqueKey)) return false;
      seenKeys.add(uniqueKey);
      return true;
    });
  }

  private getCache(): CacheItem[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const data = localStorage.getItem(CACHE_CONFIG.KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  private getFromCache(query: string): OSMFeature[] | null {
    const cache = this.getCache();
    const item = cache.find((c) => c.query.toLowerCase() === query.toLowerCase());
    if (item && Date.now() - item.timestamp < CACHE_CONFIG.TTL) {
      return item.results;
    }
    return null;
  }

  private searchInCache(partialQuery: string): OSMFeature[] | null {
    const cache = this.getCache();
    const normalizedQuery = this.normalizeStr(partialQuery);

    // Busca em TODAS as entradas do cache
    const allMatches: OSMFeature[] = [];

    cache.forEach(cacheItem => {
      const filtered = cacheItem.results.filter(result => {
        const name = this.normalizeStr(result.properties.name);
        return name.includes(normalizedQuery);
      });
      allMatches.push(...filtered);
    });

    if (allMatches.length === 0) return null;

    // Remove duplicados por osm_id
    const uniqueMatches = new Map<number, OSMFeature>();
    allMatches.forEach(match => {
      if (!uniqueMatches.has(match.properties.osm_id)) {
        uniqueMatches.set(match.properties.osm_id, match);
      }
    });

    // Ordena por relevância: startsWith primeiro, depois includes
    const sortedResults = Array.from(uniqueMatches.values()).sort((a, b) => {
      const nameA = this.normalizeStr(a.properties.name);
      const nameB = this.normalizeStr(b.properties.name);
      const startsA = nameA.startsWith(normalizedQuery);
      const startsB = nameB.startsWith(normalizedQuery);

      if (startsA && !startsB) return -1;
      if (!startsA && startsB) return 1;
      return 0;
    });

    return sortedResults.slice(0, SEARCH_CONFIG.MAX_DISPLAYED_RESULTS);
  }

  private saveToCache(query: string, results: OSMFeature[]) {
    if (typeof localStorage === 'undefined') return;
    try {
      const cache = this.getCache();
      const newCache = cache.filter(c => c.query.toLowerCase() !== query.toLowerCase());

      newCache.push({
        query,
        results,
        timestamp: Date.now()
      });

      if (newCache.length > CACHE_CONFIG.MAX_ENTRIES) newCache.shift();

      localStorage.setItem(CACHE_CONFIG.KEY, JSON.stringify(newCache));
    } catch (e) {
      // Silently fail
    }
  }

  private cleanOldCache() {
    if (typeof localStorage === 'undefined') return;
    try {
      const cache = this.getCache();
      const validCache = cache.filter(c => Date.now() - c.timestamp < CACHE_CONFIG.TTL);
      if (validCache.length !== cache.length) {
        localStorage.setItem(CACHE_CONFIG.KEY, JSON.stringify(validCache));
      }
    } catch (e) {
      // Silently fail
    }
  }
}

export const searchState = new SearchState();