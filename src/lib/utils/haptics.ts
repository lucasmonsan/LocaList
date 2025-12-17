import { browser } from '$app/environment';

/**
 * Haptic feedback utilities for mobile devices
 * Provides vibration feedback for user interactions
 * Respects prefers-reduced-motion user preference
 */

const isSupported = browser && 'vibrate' in navigator;
const prefersReduced = browser && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Trigger haptic feedback if supported and not disabled by user preference
 * @param pattern - Vibration pattern (number or array of numbers)
 */
function vibrate(pattern: number | number[]): void {
	if (!isSupported || prefersReduced) return;
	
	try {
		navigator.vibrate(pattern);
	} catch (error) {
	}
}

/**
 * Light haptic feedback (5ms)
 * Use for: minor interactions, list item selection, toggle switches
 */
export function light(): void {
	vibrate(5);
}

/**
 * Medium haptic feedback (10ms)
 * Use for: button clicks, pin selection, favoriting
 */
export function medium(): void {
	vibrate(10);
}

/**
 * Heavy haptic feedback (15ms)
 * Use for: important actions, modal opens, confirmations
 */
export function heavy(): void {
	vibrate(15);
}

/**
 * Success haptic feedback (double pulse)
 * Use for: successful form submissions, pin creation, review posted
 */
export function success(): void {
	vibrate([10, 50, 10]);
}

/**
 * Error haptic feedback (triple pulse)
 * Use for: validation errors, failed operations
 */
export function error(): void {
	vibrate([50, 100, 50]);
}

/**
 * Selection haptic feedback
 * Use for: selecting items from a list
 */
export function selection(): void {
	light();
}

export const haptics = {
	light,
	medium,
	heavy,
	success,
	error,
	selection
};

