import { logger } from '$lib/utils/logger';
import type { LeafletMap, LeafletMarker, LeafletLibrary } from '$lib/types/leaflet.types';
import type { OSMFeature } from '$lib/types/osm.types';
import type { PinWithCategory } from '$lib/types/database.types';
import { getPlaceType } from '$lib/utils/osm';
import { MAP_CONFIG } from '$lib/constants/config';
import { toast } from '$lib/components/toast/toast.svelte';
import { i18n } from '$lib/i18n/i18n.svelte';
import { navigationService } from '$lib/services/navigation.service';
import { ghostPinState } from '$lib/stores/ghostPin.svelte';
import { haptics } from '$lib/utils/haptics';
import '$lib/styles/pins.css';

class MapState {
  private map: LeafletMap | null = $state(null);
  private L: LeafletLibrary | null = null;
  private currentLayer: LeafletMarker | null = null;
  private clusterGroup: any = null; // L.MarkerClusterGroup
  private userLocationMarker: LeafletMarker | null = null;
  private ghostPinMarker: LeafletMarker | null = null;
  pins = $state<PinWithCategory[]>([]);
  userLocation = $state<{ lat: number; lng: number } | null>(null);
  selectedPinId = $state<string | null>(null);
  private markers = new Map<string, LeafletMarker>();
  private watchId: number | null = null;

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

      // Auto-locate user if permission already granted
      if ('permissions' in navigator && 'geolocation' in navigator) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
          if (permissionStatus.state === 'granted') {
            // Silently locate user without showing toast
            this.locateUser().catch(() => {
              // Ignore errors on auto-locate
            });
          }
        } catch (error) {
          // Permissions API not supported, ignore
        }
      }
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

  locateUser(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.map) {
        reject(new Error('Map not initialized'));
        return;
      }

      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            this.map!.flyTo([latitude, longitude], MAP_CONFIG.SEARCH_ZOOM);
            toast.success(i18n.t.success.locationFound);
            resolve();
          },
          (error) => {
            console.error('Geolocation error:', error);
            if (error.code === 1) {
              toast.error(i18n.t.errors.locationDenied);
            } else if (error.code === 2) {
              toast.error(i18n.t.errors.locationUnavailable);
            } else if (error.code === 3) {
              toast.error(i18n.t.errors.locationTimeout);
            } else {
              toast.error(i18n.t.errors.locationUnavailable);
            }
            reject(error);
          },
          {
            enableHighAccuracy: false,
            timeout: 10000, // 10 seconds timeout
            maximumAge: 30000 // Accept cached position up to 30 seconds old
          }
        );
      } else {
        toast.error(i18n.t.errors.locationUnavailable);
        reject(new Error('Geolocation not available'));
      }
    });
  }

  selectLocation(feature: OSMFeature) {
    if (!this.map || !this.L) return;

    const { geometry, properties } = feature;
    const [lng, lat] = geometry.coordinates;
    const type = getPlaceType(properties);

    if (this.currentLayer) {
      this.map.removeLayer(this.currentLayer);
    }

    // Pin de busca - visual diferente do pin do usuário
    const icon = this.L.divIcon({
      className: 'search-location-pin',
      html: `
        <div class="search-pin-marker">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
      `,
      iconSize: [32, 40],
      iconAnchor: [16, 40]
    });

    this.currentLayer = this.L.marker([lat, lng], { icon, zIndexOffset: 500 }).addTo(this.map);

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

  selectPin(pinId: string) {
    if (!this.map || !this.L) return;

    this.deselectPin();
    this.selectedPinId = pinId;

    const marker = this.markers.get(pinId);
    if (marker) {
      // Zoom to pin
      const latLng = marker.getLatLng();
      this.map.flyTo(latLng, 16, { animate: true, duration: 0.5 });

      // Add selected class
      // Note: we need to delay slightly if the marker is inside a cluster and needs to expand
      // But for now let's assume direct access or visible marker
      const element = marker.getElement();
      if (element) {
        element.classList.add('pin-selected');
      } else {
        // If element is not created (e.g. inside cluster), we might need to spiderfy or zoom
        // This is handled by cluster spiderfy usually, but user might need to zoom in first.
        // For now, simple implementation.
        this.clusterGroup?.zoomToShowLayer(marker, () => {
          const el = marker.getElement();
          if (el) el.classList.add('pin-selected');
        });
      }
    }
  }

  deselectPin() {
    this.selectedPinId = null;

    // Remove class from all markers that might have it
    // More efficient to just track the selected one, but iterating is safe
    this.markers.forEach(marker => {
      const element = marker.getElement();
      if (element) {
        element.classList.remove('pin-selected');
      }
    });

    // Also checking if we need to close spiderfy etc, but usually not needed for simple deselect
  }

  // ========== Pin Management ==========

  addPin(pin: PinWithCategory) {
    if (!this.map || !this.L || !this.clusterGroup) return;

    const categoryColor = pin.category?.color || '#A29BFE';
    const categoryName = pin.category?.name || 'other';

    // Criar ícone SVG inline do Lucide
    const svgIcon = this.createCategoryIconSVG(categoryName);

    const icon = this.L.divIcon({
      className: 'custom-pin-marker',
      html: `
        <div class="pin-marker-content" style="background-color: ${categoryColor};">
          ${svgIcon}
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    });

    const marker = this.L.marker([pin.latitude, pin.longitude], { icon });

    marker.on('click', () => {
      haptics.medium();
      this.selectPin(pin.id);
      navigationService.openPin(pin.id);
    });

    this.markers.set(pin.id, marker);
    this.clusterGroup.addLayer(marker);
  }

  private createCategoryIconSVG(categoryName: string): string {
    // Mapear categorias para paths SVG do Lucide
    const iconPaths: Record<string, string> = {
      restaurant: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path><path d="M7 2v20"></path><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path>',
      cafe: '<path d="M17 8h1a4 4 0 1 1 0 8h-1"></path><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"></path><line x1="6" x2="6" y1="2" y2="4"></line><line x1="10" x2="10" y1="2" y2="4"></line><line x1="14" x2="14" y1="2" y2="4"></line>',
      hotel: '<path d="M2 4v16"></path><path d="M2 8h18a2 2 0 0 1 2 2v10"></path><path d="M2 17h20"></path><path d="M6 8v9"></path>',
      bar: '<path d="M17 11h1a3 3 0 0 1 0 6h-1"></path><path d="M9 12v6"></path><path d="M13 12v6"></path><path d="M14 7.5c-1 0-1.44.5-3 .5s-2-.5-3-.5-1.72.5-2.5.5a2.5 2.5 0 0 1 0-5c.78 0 1.57.5 2.5.5S9.44 2 11 2s2 1.5 3 1.5 1.72-.5 2.5-.5a2.5 2.5 0 0 1 0 5c-.78 0-1.5-.5-2.5-.5Z"></path><path d="M5 8v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8"></path>',
      hospital: '<path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h5v5c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2z"></path>',
      pharmacy: '<rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M7 7h.01"></path><path d="M17 7h.01"></path><path d="M7 17h.01"></path><path d="M17 17h.01"></path><path d="m8 12 8 0"></path><path d="m12 16 0-8"></path>',
      bank: '<path d="m3 21 18 0"></path><path d="m3 10 18 0"></path><path d="M5 6l7-3 7 3"></path><path d="M4 10l0 11"></path><path d="M20 10l0 11"></path><path d="M8 14l0 3"></path><path d="M12 14l0 3"></path><path d="M16 14l0 3"></path>',
      park: '<path d="M12 3v18"></path><path d="m8 11-4 4h16l-4-4"></path><path d="M8 19h8"></path>',
      museum: '<path d="M3 21h18"></path><path d="M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7"></path><path d="M4 21V10.5"></path><path d="M20 21V10.5"></path><path d="M12 21V10.5"></path><path d="M2 7h20"></path><path d="M5 3 19 3"></path>',
      market: '<circle cx="8" cy="21" r="1"></circle><circle cx="19" cy="21" r="1"></circle><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>',
      gym: '<path d="M14.4 14.4 9.6 9.6"></path><path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.828l-1.768 1.768a2 2 0 1 1 2.828 2.829z"></path><path d="m21.5 21.5-1.4-1.4"></path><path d="M3.9 3.9 2.5 2.5"></path><path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z"></path>',
      school: '<path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path>',
      shopping: '<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"></path><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"></path><path d="M2 7h20"></path><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"></path>',
      cinema: '<rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="m16 10-4-3-4 3v7l4-3 4 3z"></path>',
      church: '<path d="m18 7 4 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9l4-2"></path><path d="M14 22v-4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4"></path><path d="M18 22V5l-6-3-6 3v17"></path><path d="M12 7v5"></path><path d="M10 9h4"></path>',
      gas_station: '<path d="M3 2h6v20H3z"></path><path d="M14 10h1"></path><path d="M14 16h1"></path><path d="M14 6h1"></path><path d="M21 4a2 2 0 0 0-2-2h-1a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2z"></path><path d="M21 20v-2"></path><path d="M6 6h.01"></path><path d="M6 18h.01"></path>',
      beach: '<path d="M12 3v18"></path><path d="m8 11-4 4h16l-4-4"></path><path d="M8 19h8"></path>',
      other: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle>'
    };

    const path = iconPaths[categoryName] || iconPaths.other;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
  }

  setPins(pins: PinWithCategory[]) {
    this.pins = pins;
    this.clearPins();
    pins.forEach(pin => this.addPin(pin));
  }

  clearPins() {
    if (this.clusterGroup) {
      this.clusterGroup.clearLayers();
      this.markers.clear();
      this.selectedPinId = null;
    }
  }

  getBounds() {
    if (!this.map) return null;
    return this.map.getBounds();
  }

  // ========== User Location ==========

  startWatchingUserLocation() {
    if (!('geolocation' in navigator)) return;

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        this.updateUserLocationMarker();
      },
      (error) => {
        logger.warn('Geolocation watch error:', error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 5000
      }
    );
  }

  stopWatchingUserLocation() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    if (this.userLocationMarker && this.map) {
      this.map.removeLayer(this.userLocationMarker);
      this.userLocationMarker = null;
    }
  }

  private updateUserLocationMarker() {
    if (!this.map || !this.L || !this.userLocation) return;

    // Remove marker antigo se existir
    if (this.userLocationMarker) {
      this.map.removeLayer(this.userLocationMarker);
    }

    const icon = this.L.divIcon({
      className: 'user-location-pin',
      html: `
        <div class="user-pin-marker">
          <div class="user-pin-pulse"></div>
          <div class="user-pin-dot"></div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    this.userLocationMarker = this.L.marker(
      [this.userLocation.lat, this.userLocation.lng],
      {
        icon,
        zIndexOffset: 1000 // sempre por cima de outros pins
      }
    ).addTo(this.map);
  }

  // ========== Ghost Pin ==========

  handleMapClick(lat: number, lng: number) {
    // Verificar pins próximos (raio de 50m)
    const nearby = this.findNearbyPins(lat, lng, 0.05); // ~50 metros

    haptics.medium();
    ghostPinState.setGhostPin(lat, lng, nearby);
    this.showGhostPin(lat, lng);
  }

  private showGhostPin(lat: number, lng: number) {
    if (!this.map || !this.L) return;

    // Remove ghost pin anterior se existir
    if (this.ghostPinMarker) {
      this.map.removeLayer(this.ghostPinMarker);
      this.ghostPinMarker = null;
    }

    // Criar ícone do ghost pin com animação de pulso
    // O anchor deve ser no centro horizontal e na ponta inferior do pin
    const icon = this.L.divIcon({
      className: 'ghost-pin-marker',
      html: `
        <div class="ghost-pin-pulse"></div>
        <div class="ghost-pin-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40] // Centro horizontal (20px), ponta inferior (40px)
    });

    this.ghostPinMarker = this.L.marker([lat, lng], { icon, zIndexOffset: 1000 }).addTo(this.map);
  }

  clearGhostPin() {
    if (this.ghostPinMarker && this.map) {
      this.map.removeLayer(this.ghostPinMarker);
      this.ghostPinMarker = null;
    }
  }

  private findNearbyPins(lat: number, lng: number, radiusKm: number): PinWithCategory[] {
    return this.pins.filter(pin => {
      const distance = this.calculateDistance(lat, lng, pin.latitude, pin.longitude);
      return distance <= radiusKm;
    });
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

export const mapState = new MapState();