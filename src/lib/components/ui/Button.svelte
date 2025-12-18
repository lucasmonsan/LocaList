<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	interface Props extends HTMLButtonAttributes {
		children: Snippet;
		radius?: 'in' | 'out';
		variant?: 'ghost' | 'outline' | 'icon' | 'primary' | 'secondary' | '';
		invisible?: boolean;
	}

	let { children, variant = '', radius = 'in', invisible = false, ...rest }: Props = $props();
</script>

<button class="{variant} {radius}" class:invisible data-invisible={invisible} {...rest}>
	{@render children()}
</button>

<style>
	button {
		--btn-bg: var(--surface);
		--btn-color: var(--text-primary);
		--btn-border-width: 2px;

		position: relative;
		overflow: visible;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--xxs);
		min-width: var(--xl);
		min-height: var(--xl);
		padding: var(--xs) var(--sm);
		font-weight: 600;
		font-size: var(--sm);
		border: none;
		cursor: pointer;
		user-select: none;
		-moz-user-select: none;
		-webkit-tap-highlight-color: transparent;
		background: var(--btn-bg);
		color: var(--btn-color);
		transition: all 0.3s ease;

		&.in {
			border-radius: var(--radius-in);
		}

		&.out {
			border-radius: var(--radius-out);
		}

		/* Focus Visible */
		&:focus-visible {
			outline: 2px solid var(--brand-primary);
			outline-offset: 2px;
		}

		/* Primary - Gradient Border Effect */
		&.primary {
			background: linear-gradient(135deg, var(--brand-primary) 0%, transparent 50%);
			background-color: color-mix(in srgb, var(--brand-primary) 20%, transparent);
			color: white;
			padding: calc(var(--xs) + var(--btn-border-width)) calc(var(--sm) + var(--btn-border-width));
		}

		&.primary::before {
			content: '';
			position: absolute;
			inset: var(--btn-border-width);
			background: var(--brand-primary);
			border-radius: inherit;
			z-index: -1;
		}

		&.primary:hover:not(:disabled) {
			background-color: color-mix(in srgb, var(--brand-primary) 70%, transparent);
			box-shadow: 0 0 20px color-mix(in srgb, var(--brand-primary) 50%, transparent);
		}

		&.primary:active:not(:disabled) {
			background-color: color-mix(in srgb, var(--brand-primary) 90%, transparent);
			box-shadow: 0 0 10px color-mix(in srgb, var(--brand-primary) 30%, transparent);
		}

		/* Secondary - Subtle Gradient */
		&.secondary {
			background: linear-gradient(135deg, color-mix(in srgb, var(--text-primary) 10%, transparent) 0%, transparent 50%);
			background-color: var(--surface);
			color: var(--text-primary);
			box-shadow: var(--shadow-sm);
		}

		&.secondary:hover:not(:disabled) {
			background-color: var(--bg);
			box-shadow: var(--shadow-md);
		}

		&.secondary:active:not(:disabled) {
			background-color: var(--bg);
			box-shadow: var(--shadow-sm);
		}

		/* Outline - Gradient Border */
		&.outline {
			background: transparent;
			color: var(--text-primary);
			border: var(--btn-border-width) solid transparent;
			background-image: linear-gradient(var(--surface), var(--surface)), linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
			background-origin: border-box;
			background-clip: padding-box, border-box;
		}

		&.outline:hover:not(:disabled) {
			background-image:
				linear-gradient(color-mix(in srgb, var(--brand-primary) 5%, var(--surface)), color-mix(in srgb, var(--brand-primary) 5%, var(--surface))),
				linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
		}

		&.outline:active:not(:disabled) {
			background-image:
				linear-gradient(color-mix(in srgb, var(--brand-primary) 10%, var(--surface)), color-mix(in srgb, var(--brand-primary) 10%, var(--surface))),
				linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
		}

		/* Icon */
		&.icon {
			background: var(--surface);
			color: var(--text-primary);
			box-shadow:
				0 2px 8px rgba(0, 0, 0, 0.12),
				0 1px 3px rgba(0, 0, 0, 0.08);
			width: var(--xxxl);
			height: var(--xxxl);
			padding: 0;
			min-width: var(--xxxl);
			min-height: var(--xxxl);
			overflow: hidden; /* Prevent pseudo-elements from affecting size */
		}

		&.icon:hover:not(:disabled):not(.invisible) {
			background: color-mix(in srgb, var(--brand-primary) 10%, var(--surface));
		}

		&.icon:active:not(:disabled):not(.invisible) {
			background: color-mix(in srgb, var(--brand-primary) 15%, var(--surface));
		}

		/* Ghost */
		&.ghost {
			background: transparent;
			color: var(--text-primary);
			padding: 0;
			border-radius: 0;
			min-width: auto;
			min-height: auto;
		}

		&.ghost:hover:not(:disabled):not(.invisible) {
			background: color-mix(in srgb, var(--text-primary) 5%, transparent);
			border-radius: var(--radius-in);
		}

		&.ghost:active:not(:disabled):not(.invisible) {
			background: color-mix(in srgb, var(--text-primary) 10%, transparent);
		}

		/* Invisible */
		&.invisible,
		&[data-invisible='true'] {
			background: transparent;
		}

		&.invisible:hover:not(:disabled),
		&[data-invisible='true']:hover:not(:disabled) {
			background: transparent !important;
			box-shadow: none !important;
		}

		/* Default */
		&:not(.ghost):not(.icon):not(.primary):not(.secondary):not(.outline):hover:not(:disabled):not(.invisible) {
			box-shadow: var(--shadow-md);
			background: color-mix(in srgb, var(--brand-primary) 5%, var(--surface));
		}

		&:not(.ghost):not(.icon):not(.primary):not(.secondary):not(.outline):active:not(:disabled):not(.invisible) {
			box-shadow: var(--shadow-sm);
			background: color-mix(in srgb, var(--brand-primary) 8%, var(--surface));
		}

		/* Disabled */
		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
			filter: grayscale(0.3);
		}
	}
</style>
