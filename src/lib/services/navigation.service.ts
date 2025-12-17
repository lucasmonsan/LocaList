import { goto } from '$app/navigation';
import { browser } from '$app/environment';

/**
 * Serviço de navegação para gerenciar estado da aplicação via URL
 * Usa query parameters e History API para navegação fluida sem recarregar página
 * 
 * Estrutura de URLs:
 * - / → Mapa principal
 * - /?pin=<id> → BottomSheet colapsado (30%)
 * - /?pin=<id>&expanded=true → BottomSheet expandido (80%)
 * - /?pin=<id>&expanded=true&review=true → ReviewForm aberto
 * - /favorites → Lista de favoritos
 * - /favorites?pin=<id> → Favoritos + BottomSheet
 */
class NavigationService {
	/**
	 * Abre BottomSheet com pin específico
	 * @param pinId - ID do pin a ser aberto
	 * @param expanded - Se deve abrir expandido (80%) ou colapsado (30%)
	 */
	openPin(pinId: string, expanded = false) {
		if (!browser) return;
		
		const params = new URLSearchParams();
		params.set('pin', pinId);
		if (expanded) params.set('expanded', 'true');
		
		const currentPath = window.location.pathname;
		goto(`${currentPath}?${params.toString()}`, { 
			replaceState: false,
			keepFocus: true,
			noScroll: true
		});
	}
	
	/**
	 * Expande BottomSheet (30% → 80%)
	 * Adiciona ?expanded=true na URL
	 */
	expandBottomSheet() {
		if (!browser) return;
		
		const params = new URLSearchParams(window.location.search);
		if (!params.get('pin')) return; // Precisa ter pin aberto
		
		params.set('expanded', 'true');
		const currentPath = window.location.pathname;
		goto(`${currentPath}?${params.toString()}`, { 
			replaceState: false,
			keepFocus: true,
			noScroll: true
		});
	}
	
	/**
	 * Colapsa BottomSheet (80% → 30%)
	 * Remove ?expanded=true da URL
	 */
	collapseBottomSheet() {
		if (!browser) return;
		
		const params = new URLSearchParams(window.location.search);
		params.delete('expanded');
		params.delete('review'); // Remove review form se estiver aberto
		
		const currentPath = window.location.pathname;
		const query = params.toString();
		goto(`${currentPath}${query ? '?' + query : ''}`, { 
			replaceState: false,
			keepFocus: true,
			noScroll: true
		});
	}
	
	/**
	 * Fecha BottomSheet completamente
	 * Remove todos os query params
	 */
	closeBottomSheet() {
		if (!browser) return;
		
		const currentPath = window.location.pathname;
		goto(currentPath, { 
			replaceState: false,
			keepFocus: true,
			noScroll: true
		});
	}
	
	/**
	 * Abre ReviewForm dentro do BottomSheet
	 * URL: /?pin=X&expanded=true&review=true
	 */
	openReviewForm(pinId: string) {
		if (!browser) return;
		
		const params = new URLSearchParams();
		params.set('pin', pinId);
		params.set('expanded', 'true');
		params.set('review', 'true');
		
		const currentPath = window.location.pathname;
		goto(`${currentPath}?${params.toString()}`, { 
			replaceState: false,
			keepFocus: true,
			noScroll: true
		});
	}
	
	/**
	 * Fecha ReviewForm mas mantém BottomSheet expandido
	 */
	closeReviewForm() {
		if (!browser) return;
		
		const params = new URLSearchParams(window.location.search);
		params.delete('review');
		
		const currentPath = window.location.pathname;
		const query = params.toString();
		goto(`${currentPath}?${query}`, { 
			replaceState: false,
			keepFocus: true,
			noScroll: true
		});
	}
	
	/**
	 * Navega para lista de favoritos
	 */
	goToFavorites() {
		if (!browser) return;
		goto('/favorites', { replaceState: false });
	}
	
	/**
	 * Volta para o mapa (home)
	 */
	goToMap() {
		if (!browser) return;
		goto('/', { replaceState: false });
	}
	
	/**
	 * Obtém o estado atual da URL
	 */
	getCurrentState() {
		if (!browser) return { pinId: null, expanded: false, showReview: false };
		
		const params = new URLSearchParams(window.location.search);
		return {
			pinId: params.get('pin'),
			expanded: params.get('expanded') === 'true',
			showReview: params.get('review') === 'true'
		};
	}
}

export const navigationService = new NavigationService();

