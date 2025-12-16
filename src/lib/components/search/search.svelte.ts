import type { OSMFeature, PhotonResponse } from '$lib/types/osm.types';
import type { CacheItem } from '$lib/types/search.types';
import { mapState } from '../map/map.svelte';
import { API } from '$lib/constants/api';
import { CACHE_CONFIG, SEARCH_CONFIG } from '$lib/constants/config';
import { normalizeStr } from '$lib/utils/string';
import { toast } from '$lib/components/toast/toast.svelte';
import { i18n } from '$lib/i18n/i18n.svelte';

class SearchState {
  query = $state('');
  focused = $state(false);
  loading = $state(false);
  results = $state<OSMFeature[]>([]);
  hasSearched = $state(false);
  focusedIndex = $state(-1);

  lastSearchedQuery = $state('');
  private isResultSelected = false;
  private initialized = false;

  private ensureInitialized() {
    if (!this.initialized && typeof localStorage !== 'undefined') {
      this.initialized = true;
      this.cleanOldCache();
    }
  }

  clear() {
    this.query = '';
    this.results = [];
    this.hasSearched = false;
    this.isResultSelected = false;
    this.lastSearchedQuery = '';
    this.focusedIndex = -1;
  }

  setQuery(value: string) {
    this.ensureInitialized();
    this.query = value;
    this.isResultSelected = false;
    this.focusedIndex = -1;

    if (value.length === 0) {
      this.results = [];
      this.hasSearched = false;
      return;
    }

    if (value.length < SEARCH_CONFIG.MIN_QUERY_LENGTH) {
      this.results = [];
      this.hasSearched = false;
      return;
    }

    const localResults = this.searchInCache(value);

    if (localResults && localResults.length > 0) {
      this.results = localResults;
    } else {
      this.results = [];
    }
  }

  navigateDown() {
    if (this.results.length === 0) return;
    if (this.focusedIndex < this.results.length - 1) {
      this.focusedIndex++;
    } else {
      this.focusedIndex = 0;
    }
  }

  navigateUp() {
    if (this.results.length === 0) return;
    if (this.focusedIndex > 0) {
      this.focusedIndex--;
    } else {
      this.focusedIndex = this.results.length - 1;
    }
  }

  selectFocused() {
    if (this.focusedIndex >= 0 && this.results[this.focusedIndex]) {
      this.selectResult(this.results[this.focusedIndex]);
    }
  }

  closeResults() {
    this.focused = false;
    this.focusedIndex = -1;
    this.results = [];
  }

  async search() {
    this.ensureInitialized();
    if (!this.shouldPerformSearch()) return;

    this.loading = true;
    this.hasSearched = false;
    this.focusedIndex = -1;

    try {
      // Tenta cache exato primeiro
      const cached = this.getFromCache(this.query);
      if (cached) {
        this.results = cached;
        this.finishSearch();
        return;
      }

      const data = await this.fetchFromAPI();
      this.processResults(data);

    } catch (error) {
      this.results = [];
      toast.error(i18n.t.errors.searchFailed);
      console.error('Search error:', error);
    } finally {
      this.finishSearch();
    }
  }

  selectResult(result: OSMFeature) {
    const label = result.properties.name;
    this.query = label;
    this.lastSearchedQuery = label;
    this.isResultSelected = true;
    this.results = [];
    this.focused = false;
    this.focusedIndex = -1;

    mapState.selectLocation(result);
  }

  private shouldPerformSearch(): boolean {
    if (!this.query.trim()) return false;
    if (this.query === this.lastSearchedQuery) return false;
    if (this.isResultSelected) return false;
    return true;
  }

  private async fetchFromAPI(): Promise<PhotonResponse> {
    const url = this.buildAPIUrl();
    const response = await fetch(url);

    if (!response.ok) {
      return await this.tryFallbackRequest(url);
    }

    return await response.json();
  }

  private buildAPIUrl(): string {
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

    return `${API.PHOTON_BASE_URL}?${params}`;
  }

  private async tryFallbackRequest(originalUrl: string): Promise<PhotonResponse> {
    if (!originalUrl.includes(`&lang=${API.DEFAULT_LANG}`)) {
      throw new Error('API request failed');
    }

    const fallbackUrl = originalUrl.replace(`&lang=${API.DEFAULT_LANG}`, '');
    const fallbackResponse = await fetch(fallbackUrl);

    if (!fallbackResponse.ok) {
      throw new Error('Fallback request failed');
    }

    return await fallbackResponse.json();
  }

  private processResults(data: PhotonResponse) {
    if (!data || !data.features) {
      this.results = [];
      return;
    }

    const uniqueResults = this.filterDuplicates(data.features);
    const finalResults = uniqueResults.slice(0, SEARCH_CONFIG.MAX_DISPLAYED_RESULTS);
    this.results = finalResults;
    this.saveToCache(this.query, finalResults);
  }

  private finishSearch() {
    this.loading = false;
    this.hasSearched = true;
    this.lastSearchedQuery = this.query;
  }

  private filterDuplicates(features: OSMFeature[]): OSMFeature[] {
    if (!Array.isArray(features)) return [];

    const seenIds = new Set<number>();
    const seenKeys = new Set<string>();

    return features.filter((feature) => {
      if (feature.properties.country === 'Brazil') {
        feature.properties.country = 'Brasil';
      }

      if (feature.properties.osm_id) {
        if (seenIds.has(feature.properties.osm_id)) return false;
        seenIds.add(feature.properties.osm_id);
      }

      const uniqueKey = this.generateUniqueKey(feature);
      const name = normalizeStr(feature.properties.name);

      if (!name) return true;

      if (seenKeys.has(uniqueKey)) return false;
      seenKeys.add(uniqueKey);
      return true;
    });
  }

  private generateUniqueKey(feature: OSMFeature): string {
    const p = feature.properties;
    const name = normalizeStr(p.name);
    const city = normalizeStr(p.city);
    const street = normalizeStr(p.street);

    if (p.osm_key === 'highway') {
      return `street|${name}|${city}`;
    }

    return `poi|${name}|${city}|${street}`;
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
    const normalizedQuery = normalizeStr(partialQuery);

    const allMatches = this.collectMatchesFromCache(cache, normalizedQuery);

    if (allMatches.length === 0) return null;

    const uniqueMatches = this.deduplicateMatches(allMatches);
    const sortedResults = this.sortByRelevance(uniqueMatches, normalizedQuery);

    return sortedResults.slice(0, SEARCH_CONFIG.MAX_DISPLAYED_RESULTS);
  }

  private collectMatchesFromCache(cache: CacheItem[], normalizedQuery: string): OSMFeature[] {
    const allMatches: OSMFeature[] = [];

    cache.forEach(cacheItem => {
      const filtered = cacheItem.results.filter(result => {
        const name = normalizeStr(result.properties.name);
        return name.includes(normalizedQuery);
      });
      allMatches.push(...filtered);
    });

    return allMatches;
  }

  private deduplicateMatches(matches: OSMFeature[]): OSMFeature[] {
    const uniqueMatches = new Map<number, OSMFeature>();

    matches.forEach(match => {
      if (!uniqueMatches.has(match.properties.osm_id)) {
        uniqueMatches.set(match.properties.osm_id, match);
      }
    });

    return Array.from(uniqueMatches.values());
  }

  private sortByRelevance(results: OSMFeature[], normalizedQuery: string): OSMFeature[] {
    return results.sort((a, b) => {
      const nameA = normalizeStr(a.properties.name);
      const nameB = normalizeStr(b.properties.name);
      const startsA = nameA.startsWith(normalizedQuery);
      const startsB = nameB.startsWith(normalizedQuery);

      if (startsA && !startsB) return -1;
      if (!startsA && startsB) return 1;
      return 0;
    });
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

      if (newCache.length > CACHE_CONFIG.MAX_ENTRIES) {
        newCache.shift();
      }

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