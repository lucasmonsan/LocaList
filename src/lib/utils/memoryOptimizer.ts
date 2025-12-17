/**
 * Memory optimization utilities
 */

// Limpar cache de imagens antigas
export function clearImageCache() {
	if ('caches' in window) {
		caches.keys().then((names) => {
			names.forEach((name) => {
				if (name.includes('image') || name.includes('photo')) {
					caches.delete(name);
				}
			});
		});
	}
}

// Limpar localStorage de dados antigos
export function clearOldLocalStorage() {
	const keys = Object.keys(localStorage);
	const now = Date.now();
	const MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 dias

	keys.forEach((key) => {
		try {
			const item = localStorage.getItem(key);
			if (item) {
				const data = JSON.parse(item);
				if (data.timestamp && now - data.timestamp > MAX_AGE) {
					localStorage.removeItem(key);
				}
			}
		} catch (e) {
			// Ignora erros de parse
		}
	});
}

// Debounce para prevenir múltiplas execuções
export function debounce<T extends (...args: any[]) => any>(
	func: T,
	wait: number
): (...args: Parameters<T>) => void {
	let timeout: ReturnType<typeof setTimeout> | null = null;

	return function executedFunction(...args: Parameters<T>) {
		const later = () => {
			timeout = null;
			func(...args);
		};

		if (timeout !== null) {
			clearTimeout(timeout);
		}
		timeout = setTimeout(later, wait);
	};
}

// Throttle para limitar frequência de execução
export function throttle<T extends (...args: any[]) => any>(
	func: T,
	limit: number
): (...args: Parameters<T>) => void {
	let inThrottle: boolean;

	return function executedFunction(...args: Parameters<T>) {
		if (!inThrottle) {
			func(...args);
			inThrottle = true;
			setTimeout(() => (inThrottle = false), limit);
		}
	};
}

