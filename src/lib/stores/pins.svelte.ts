import type { PinWithCategory, PinWithDetails } from '$lib/types/database.types';
import { PinsService } from '$lib/services/pins.service';
import { toast } from '$lib/components/toast/toast.svelte';
import { i18n } from '$lib/i18n/i18n.svelte';

class PinsState {
	pins = $state<PinWithCategory[]>([]);
	selectedPin = $state<PinWithDetails | null>(null);
	loading = $state(false);
	error = $state<string | null>(null);

	async loadPins(userId?: string) {
		this.loading = true;
		this.error = null;

		try {
			this.pins = await PinsService.getPins(userId);
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Failed to load pins';
			toast.error(i18n.t.errors.loadPinsFailed || 'Failed to load pins');
			console.error('Error loading pins:', err);
		} finally {
			this.loading = false;
		}
	}

	async loadPinsByBounds(
		minLat: number,
		maxLat: number,
		minLng: number,
		maxLng: number,
		userId?: string
	) {
		this.loading = true;
		this.error = null;

		try {
			this.pins = await PinsService.getPinsByBounds(minLat, maxLat, minLng, maxLng, userId);
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Failed to load pins';
			console.error('Error loading pins by bounds:', err);
		} finally {
			this.loading = false;
		}
	}

	async selectPin(pinId: string, userId?: string) {
		this.loading = true;
		this.error = null;

		try {
			this.selectedPin = await PinsService.getPinById(pinId, userId);
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Failed to load pin';
			toast.error(i18n.t.errors.loadPinFailed || 'Failed to load pin');
			console.error('Error loading pin:', err);
		} finally {
			this.loading = false;
		}
	}

	clearSelectedPin() {
		this.selectedPin = null;
	}

	async toggleFavorite(pinId: string, userId: string) {
		try {
			const isFavorited = await PinsService.toggleFavorite(pinId, userId);
			
			// Update selected pin if it's the one being favorited
			if (this.selectedPin && this.selectedPin.id === pinId) {
				this.selectedPin.is_favorited = isFavorited;
				this.selectedPin.favorites_count += isFavorited ? 1 : -1;
			}

			toast.success(
				isFavorited
					? i18n.t.success.pinFavorited || 'Pin favorited!'
					: i18n.t.success.pinUnfavorited || 'Pin unfavorited!'
			);
		} catch (err) {
			toast.error(i18n.t.errors.favoriteFailed || 'Failed to update favorite');
			console.error('Error toggling favorite:', err);
		}
	}

	async deletePin(pinId: string) {
		try {
			await PinsService.deletePin(pinId);
			this.pins = this.pins.filter(p => p.id !== pinId);
			
			if (this.selectedPin?.id === pinId) {
				this.selectedPin = null;
			}

			toast.success(i18n.t.success.pinDeleted || 'Pin deleted!');
		} catch (err) {
			toast.error(i18n.t.errors.deletePinFailed || 'Failed to delete pin');
			console.error('Error deleting pin:', err);
		}
	}
}

export const pinsState = new PinsState();

