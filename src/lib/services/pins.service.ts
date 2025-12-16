import { supabase } from './supabase';
import type { Pin, PinInsert, PinUpdate, PinWithCategory, PinWithDetails } from '$lib/types/database.types';

export class PinsService {
	/**
	 * Get all public pins or user's pins
	 */
	static async getPins(userId?: string): Promise<PinWithCategory[]> {
		let query = supabase
			.from('map_pins')
			.select(`
				*,
				category:map_pin_categories(*)
			`)
			.order('created_at', { ascending: false });

		if (userId) {
			query = query.or(`is_public.eq.true,user_id.eq.${userId}`);
		} else {
			query = query.eq('is_public', true);
		}

		const { data, error } = await query;

		if (error) throw error;
		return data as PinWithCategory[];
	}

	/**
	 * Get a single pin by ID with details
	 */
	static async getPinById(pinId: string, userId?: string): Promise<PinWithDetails | null> {
		const { data: pin, error: pinError } = await supabase
			.from('map_pins')
			.select(`
				*,
				category:map_pin_categories(*)
			`)
			.eq('id', pinId)
			.single();

		if (pinError || !pin) return null;

		// Get reviews
		const { data: reviews } = await supabase
			.from('map_reviews')
			.select('*')
			.eq('pin_id', pinId)
			.order('created_at', { ascending: false });

		// Get favorites count
		const { count: favoritesCount } = await supabase
			.from('map_favorites')
			.select('*', { count: 'exact', head: true })
			.eq('pin_id', pinId);

		// Check if user favorited
		let isFavorited = false;
		if (userId) {
			const { data: favorite } = await supabase
				.from('map_favorites')
				.select('id')
				.eq('pin_id', pinId)
				.eq('user_id', userId)
				.maybeSingle();

			isFavorited = !!favorite;
		}

		// Calculate average rating
		const ratings = reviews?.map(r => r.rating) || [];
		const averageRating = ratings.length > 0
			? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
			: 0;

		return {
			...pin,
			reviews: reviews || [],
			favorites_count: favoritesCount || 0,
			average_rating: averageRating,
			is_favorited: isFavorited
		} as PinWithDetails;
	}

	/**
	 * Get pins by location (within bounds)
	 */
	static async getPinsByBounds(
		minLat: number,
		maxLat: number,
		minLng: number,
		maxLng: number,
		userId?: string
	): Promise<PinWithCategory[]> {
		let query = supabase
			.from('map_pins')
			.select(`
				*,
				category:map_pin_categories(*)
			`)
			.gte('latitude', minLat)
			.lte('latitude', maxLat)
			.gte('longitude', minLng)
			.lte('longitude', maxLng);

		if (userId) {
			query = query.or(`is_public.eq.true,user_id.eq.${userId}`);
		} else {
			query = query.eq('is_public', true);
		}

		const { data, error } = await query;

		if (error) throw error;
		return data as PinWithCategory[];
	}

	/**
	 * Get user's pins
	 */
	static async getUserPins(userId: string): Promise<PinWithCategory[]> {
		const { data, error } = await supabase
			.from('map_pins')
			.select(`
				*,
				category:map_pin_categories(*)
			`)
			.eq('user_id', userId)
			.order('created_at', { ascending: false });

		if (error) throw error;
		return data as PinWithCategory[];
	}

	/**
	 * Create a new pin
	 */
	static async createPin(pin: PinInsert): Promise<Pin> {
		const { data, error } = await supabase
			.from('map_pins')
			.insert(pin)
			.select()
			.single();

		if (error) throw error;
		return data;
	}

	/**
	 * Update a pin
	 */
	static async updatePin(pinId: string, updates: PinUpdate): Promise<Pin> {
		const { data, error } = await supabase
			.from('map_pins')
			.update(updates)
			.eq('id', pinId)
			.select()
			.single();

		if (error) throw error;
		return data;
	}

	/**
	 * Delete a pin
	 */
	static async deletePin(pinId: string): Promise<void> {
		const { error } = await supabase
			.from('map_pins')
			.delete()
			.eq('id', pinId);

		if (error) throw error;
	}

	/**
	 * Toggle favorite
	 */
	static async toggleFavorite(pinId: string, userId: string): Promise<boolean> {
		// Check if already favorited
		const { data: existing } = await supabase
			.from('map_favorites')
			.select('id')
			.eq('pin_id', pinId)
			.eq('user_id', userId)
			.maybeSingle();

		if (existing) {
			// Remove favorite
			const { error } = await supabase
				.from('map_favorites')
				.delete()
				.eq('id', existing.id);

			if (error) throw error;
			return false;
		} else {
			// Add favorite
			const { error } = await supabase
				.from('map_favorites')
				.insert({ pin_id: pinId, user_id: userId });

			if (error) throw error;
			return true;
		}
	}

	/**
	 * Get user's favorites
	 */
	static async getUserFavorites(userId: string): Promise<PinWithCategory[]> {
		const { data, error } = await supabase
			.from('map_favorites')
			.select(`
				pin:map_pins(
					*,
					category:map_pin_categories(*)
				)
			`)
			.eq('user_id', userId)
			.order('created_at', { ascending: false });

		if (error) throw error;
		return (data?.map(f => f.pin).filter(Boolean) || []) as PinWithCategory[];
	}

	/**
	 * Upload pin photo
	 */
	static async uploadPhoto(file: File, pinId: string): Promise<string> {
		const fileExt = file.name.split('.').pop();
		const fileName = `${pinId}/${Date.now()}.${fileExt}`;

		const { data, error } = await supabase.storage
			.from('pin-photos')
			.upload(fileName, file, {
				cacheControl: '3600',
				upsert: false
			});

		if (error) throw error;

		const { data: { publicUrl } } = supabase.storage
			.from('pin-photos')
			.getPublicUrl(data.path);

		return publicUrl;
	}

	/**
	 * Delete pin photo
	 */
	static async deletePhoto(photoUrl: string): Promise<void> {
		const path = photoUrl.split('/pin-photos/')[1];
		if (!path) return;

		const { error } = await supabase.storage
			.from('pin-photos')
			.remove([path]);

		if (error) throw error;
	}
}

