<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	interface Props extends HTMLButtonAttributes {
		children: Snippet;
		radius?: 'in' | 'out';
		variant?: 'ghost' | 'outline' | 'icon' | 'primary' | 'secondary' | '';
	}

	let { children, variant = '', radius = 'in', ...rest }: Props = $props();
</script>

<button class="{variant} {radius}" {...rest}>
	{@render children()}
</button>

<style>
	button {
		overflow: hidden;
		display: flex;
		min-width: var(--xl);
		min-height: var(--xl);
		padding: var(--xs);
		font-weight: 700;
		box-shadow: var(--shadow-md);
		background: var(--surface);
		color: var(--text-primary);
		user-select: none;
		-moz-user-select: none;
		-webkit-tap-highlight-color: transparent;
		transition: all var(--fast);

		&.in {
			border-radius: var(--radius-in);
		}

		&.out {
			border-radius: var(--radius-out);
		}

		&.icon {
			width: 100%;
			max-width: var(--xxxl);
			max-height: var(--xxxl);
		}

		&.ghost {
			padding: 0;
			background: transparent;
			box-shadow: none;
			border-radius: 0;
		}

		&:hover:not(:disabled):not(.ghost) {
			transform: translateY(-2px);
			box-shadow: var(--shadow-lg);
			background: color-mix(in srgb, var(--brand-primary) 8%, var(--surface));
		}

		&:active:not(:disabled):not(.ghost) {
			transform: translateY(0);
			box-shadow: var(--shadow-sm);
			background: var(--surface);
		}

		&.ghost:hover:not(:disabled) {
			background: var(--bg);
			border-radius: var(--radius-in);
		}

		&.icon:hover:not(:disabled) {
			background: color-mix(in srgb, var(--brand-primary) 12%, var(--surface));
			transform: translateY(-2px);
			box-shadow: var(--shadow-lg);
		}

		&.icon:active:not(:disabled) {
			transform: scale(0.95);
		}

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	}
</style>
