import { supabase } from './supabase';
import type { PinCategory } from '$lib/types/database.types';

export class CategoriesService {
	/**
	 * Get all pin categories
	 */
	static async getCategories(): Promise<PinCategory[]> {
		const { data, error } = await supabase
			.from('map_pin_categories')
			.select('*')
			.order('name');

		if (error) throw error;
		return data;
	}

	/**
	 * Get category by ID
	 */
	static async getCategoryById(id: string): Promise<PinCategory | null> {
		const { data, error } = await supabase
			.from('map_pin_categories')
			.select('*')
			.eq('id', id)
			.maybeSingle();

		if (error) throw error;
		return data;
	}
}

