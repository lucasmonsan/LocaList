import type { ComponentType } from 'svelte';
import {
	Utensils,
	Coffee,
	Bed,
	Beer,
	Cross,
	Pill,
	Landmark,
	Trees,
	Castle,
	ShoppingCart,
	Dumbbell,
	GraduationCap,
	Store,
	Clapperboard,
	Church,
	Fuel,
	Building2,
	MapPin
} from 'lucide-svelte';

/**
 * Mapeamento de categorias para ícones Lucide
 */
export const CATEGORY_ICONS: Record<string, typeof Utensils> = {
	restaurant: Utensils,
	cafe: Coffee,
	hotel: Bed,
	bar: Beer,
	hospital: Cross,
	pharmacy: Pill,
	bank: Landmark,
	park: Trees,
	museum: Castle,
	market: ShoppingCart,
	gym: Dumbbell,
	school: GraduationCap,
	shopping: Store,
	cinema: Clapperboard,
	church: Church,
	gas_station: Fuel,
	beach: Trees, // usando Trees temporariamente
	other: MapPin
};

/**
 * Cores por categoria (agrupadas semanticamente)
 */
export const CATEGORY_COLORS: Record<string, string> = {
	// Alimentação
	restaurant: '#e74c3c',
	cafe: '#d35400',
	bar: '#f39c12',

	// Acomodação
	hotel: '#3498db',

	// Saúde
	hospital: '#27ae60',
	pharmacy: '#2ecc71',

	// Lazer
	park: '#16a085',
	museum: '#9b59b6',
	cinema: '#8e44ad',
	beach: '#74b9ff',

	// Comércio
	market: '#e67e22',
	shopping: '#f39c12',
	bank: '#2980b9',

	// Educação/Religião
	school: '#f1c40f',
	church: '#95a5a6',
	gym: '#e74c3c',

	// Serviços
	gas_station: '#34495e',

	// Padrão
	other: '#7f8c8d'
};

/**
 * Obtém o ícone Lucide para uma categoria
 */
export function getCategoryIcon(categoryName: string): typeof Utensils {
	return CATEGORY_ICONS[categoryName] || MapPin;
}

/**
 * Obtém a cor para uma categoria
 */
export function getCategoryColor(categoryName: string): string {
	return CATEGORY_COLORS[categoryName] || '#7f8c8d';
}

