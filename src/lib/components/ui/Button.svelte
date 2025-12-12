<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	interface Props extends HTMLButtonAttributes {
		children: Snippet;
		border?: 'in' | 'out';
		variant?: 'ghost' | 'outline' | 'icon' | '';
	}

	let { children, variant = '', border = 'in', ...rest }: Props = $props();
</script>

<button class="{variant} {border}" {...rest}>
	{@render children()}
</button>

<style>
	button {
		overflow: hidden;
		display: flex;
		min-width: var(--xl, 1.5rem);
		min-height: var(--xl, 1.5rem);
		padding: var(--xxs, 0.4rem);
		box-shadow: var(--shadow-md, 0 4px 6px rgba(0, 0, 0, 0.1));
		background: var(--surface, #ffffff);
		color: var(--text-primary, #101214);

		user-select: none;
		-moz-user-select: none;
		-webkit-tap-highlight-color: transparent;

		&.in {
			border-radius: var(--radius-in, 0.5rem);
		}
		&.out {
			border-radius: var(--radius-out, 1rem);
		}

		&.icon {
			width: 100%;
			max-width: var(--xxxl, 3rem);
			max-height: var(--xxxl, 3rem);
		}

		&.ghost {
			padding: 0;
			background: transparent;
			box-shadow: none;
			border-radius: 0;
		}
	}
</style>
