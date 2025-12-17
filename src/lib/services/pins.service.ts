import { supabase } from './supabase';
import { ErrorHandler, ErrorCategory } from '$lib/utils/errorHandler';
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
		try {
			const { data, error } = await supabase
				.from('map_pins')
				.insert(pin)
				.select()
				.single();

			if (error) throw error;
			return data;
		} catch (error) {
			ErrorHandler.handle(error, 'PinsService.createPin');
			throw error;
		}
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
	 * Upload pin photo (client-side - sends to API)
	 */
	static async uploadPhoto(
		originalFile: File,
		thumbnailFile: File,
		pinId: string
	): Promise<{ original: string; thumbnail: string }> {
		const formData = new FormData();
		formData.append('original', originalFile);
		formData.append('thumbnail', thumbnailFile);
		formData.append('pinId', pinId);

		const response = await fetch('/api/upload', {
			method: 'POST',
			body: formData
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Upload failed');
		}

		return await response.json();
	}

	/**
	 * Delete pin photo
	 */
	static async deletePhoto(photoUrl: string): Promise<void> {
		// This would need an API endpoint to delete from R2
		// For now, we'll just handle it server-side when deleting the pin
	}

	// ========== Reviews ==========

	/**
	 * Create review for a pin
	 */
	static async createReview(review: {
		pin_id: string;
		user_id: string;
		rating: number;
		comment?: string | null;
		photos?: string[];
	}): Promise<void> {
		// Check if user already reviewed this pin
		const { data: existing } = await supabase
			.from('map_reviews')
			.select('id')
			.eq('pin_id', review.pin_id)
			.eq('user_id', review.user_id)
			.maybeSingle();

		if (existing) {
			throw new Error('Você já avaliou este local');
		}

		const { error } = await supabase.from('map_reviews').insert(review);

		if (error) throw error;
	}

	/**
	 * Toggle review upvote
	 */
	static async toggleReviewUpvote(reviewId: string, userId: string): Promise<boolean> {
		const { data: existing } = await supabase
			.from('map_review_upvotes')
			.select('id')
			.eq('review_id', reviewId)
			.eq('user_id', userId)
			.maybeSingle();

		if (existing) {
			const { error } = await supabase
				.from('map_review_upvotes')
				.delete()
				.eq('id', existing.id);

			if (error) throw error;
			return false;
		} else {
			const { error } = await supabase
				.from('map_review_upvotes')
				.insert({ review_id: reviewId, user_id: userId });

			if (error) throw error;
			return true;
		}
	}

	/**
	 * Report review
	 * TODO: Implementar quando tabela map_review_reports for criada
	 */
	static async reportReview(reviewId: string, userId: string): Promise<void> {
		// Tabela não existe ainda no banco
		throw new Error('Feature não implementada');
	}
}

