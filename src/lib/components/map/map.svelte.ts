import type { LeafletMap, LeafletMarker, LeafletLibrary } from '$lib/types/leaflet.types';
import type { OSMFeature } from '$lib/types/osm.types';
import type { PinWithCategory } from '$lib/types/database.types';
import { getPlaceType } from '$lib/utils/osm';
import { MAP_CONFIG } from '$lib/constants/config';
import { toast } from '$lib/components/toast/toast.svelte';
import { i18n } from '$lib/i18n/i18n.svelte';
import { navigationService } from '$lib/services/navigation.service';
import { haptics } from '$lib/utils/haptics';
import '$lib/styles/pins.css';

class MapState {
  private map: LeafletMap | null = $state(null);
  private L: LeafletLibrary | null = null;
  private currentLayer: LeafletMarker | null = null;
  private clusterGroup: any = null; // L.MarkerClusterGroup
  pins = $state<PinWithCategory[]>([]);

  async setMap(mapInstance: LeafletMap | null, leafletLibrary: LeafletLibrary | null) {
    this.map = mapInstance;
    this.L = leafletLibrary;
    
    // Inicializar cluster group
    if (this.map && this.L) {
      // Importar MarkerCluster dinamicamente
      await import('leaflet.markercluster');
      
      this.clusterGroup = (this.L as any).markerClusterGroup({
        maxClusterRadius: 80,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        iconCreateFunction: (cluster: any) => {
          const count = cluster.getChildCount();
          let size = 'small';
          
          if (count > 10) size = 'medium';
          if (count > 50) size = 'large';
          
          return (this.L as any).divIcon({
            html: `<div class="cluster-marker cluster-${size}">${count}</div>`,
            className: 'marker-cluster-custom',
            iconSize: (this.L as any).point(40, 40)
          });
        }
      });
      
      this.map.addLayer(this.clusterGroup);
    }
  }

  getMap() {
    return this.map;
  }

  getCenter() {
    if (!this.map) return null;
    return this.map.getCenter();
  }

  setCenter(coords: [number, number]) {
    if (!this.map) return;
    this.map.setView(coords, MAP_CONFIG.SEARCH_ZOOM);
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

  // ========== Pin Management ==========

  addPin(pin: PinWithCategory) {
    if (!this.map || !this.L || !this.clusterGroup) return;

    const categoryColor = pin.category?.color || '#A29BFE';
    const categoryIcon = pin.category?.icon || '📍';

    const icon = this.L.divIcon({
      className: 'custom-pin-marker',
      html: `
        <div class="pin-marker-content" style="background-color: ${categoryColor};">
          ${categoryIcon}
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    });

    const marker = this.L.marker([pin.latitude, pin.longitude], { icon });
    
    marker.on('click', () => {
      haptics.medium();
      navigationService.openPin(pin.id);
    });

    this.clusterGroup.addLayer(marker);
  }

  setPins(pins: PinWithCategory[]) {
    this.pins = pins;
    this.clearPins();
    pins.forEach(pin => this.addPin(pin));
  }

  clearPins() {
    if (this.clusterGroup) {
      this.clusterGroup.clearLayers();
    }
  }

  getBounds() {
    if (!this.map) return null;
    return this.map.getBounds();
  }
}

export const mapState = new MapState();