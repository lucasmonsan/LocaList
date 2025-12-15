import type { LeafletMap, LeafletMarker, LeafletLibrary } from '$lib/types/leaflet.types';
import type { OSMFeature } from '$lib/types/osm.types';
import { getPlaceType } from '$lib/utils/osm';
import { MAP_CONFIG } from '$lib/constants/config';
import { toast } from '$lib/components/toast/toast.svelte';
import { i18n } from '$lib/i18n/i18n.svelte';
import '$lib/styles/pins.css';

class MapState {
  private map: LeafletMap | null = $state(null);
  private L: LeafletLibrary | null = null;
  private currentLayer: LeafletMarker | null = null;

  setMap(mapInstance: LeafletMap | null, leafletLibrary: LeafletLibrary | null) {
    this.map = mapInstance;
    this.L = leafletLibrary;
  }

  getMap() {
    return this.map;
  }

  getCenter() {
    if (!this.map) return null;
    return this.map.getCenter();
  }

  locateUser() {
    if (!this.map) return;

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          this.map!.flyTo([latitude, longitude], MAP_CONFIG.SEARCH_ZOOM);
          toast.success(i18n.t.success.locationFound);
        },
        (error) => {
          if (error.code === 1) {
            toast.error(i18n.t.errors.locationDenied);
          } else if (error.code === 2) {
            toast.error(i18n.t.errors.locationUnavailable);
          } else if (error.code === 3) {
            toast.error(i18n.t.errors.locationTimeout);
          } else {
            toast.error(i18n.t.errors.locationUnavailable);
          }
        }
      );
    } else {
      toast.error(i18n.t.errors.locationUnavailable);
    }
  }

  selectLocation(feature: OSMFeature) {
    if (!this.map || !this.L) return;

    const { geometry, properties } = feature;
    const [lng, lat] = geometry.coordinates;
    const type = getPlaceType(properties);

    if (this.currentLayer) {
      this.map.removeLayer(this.currentLayer);
    }

    const cssClass = type === 'area' ? 'area-marker' : 'pin-marker';
    const icon = this.L.divIcon({
      className: 'custom-pin',
      html: `<div class="${cssClass}"></div>`,
      iconSize: [MAP_CONFIG.MARKER_SIZE, MAP_CONFIG.MARKER_SIZE],
      iconAnchor: [MAP_CONFIG.MARKER_SIZE / 2, MAP_CONFIG.MARKER_SIZE / 2]
    });

    this.currentLayer = this.L.marker([lat, lng], { icon }).addTo(this.map);

    if (properties.extent) {
      const [minLng, minLat, maxLng, maxLat] = properties.extent;
      this.map.fitBounds([
        [minLat, minLng],
        [maxLat, maxLng]
      ], {
        padding: [MAP_CONFIG.FIT_BOUNDS_PADDING, MAP_CONFIG.FIT_BOUNDS_PADDING],
        maxZoom: MAP_CONFIG.FIT_BOUNDS_MAX_ZOOM,
        animate: true
      });
    } else {
      this.map.flyTo([lat, lng], MAP_CONFIG.SEARCH_ZOOM, {
        animate: true,
        duration: 1.5
      });
    }
  }
}

export const mapState = new MapState();