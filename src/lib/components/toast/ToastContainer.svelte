<script lang="ts">
	import Toast from './Toast.svelte';
	import { toast } from './toast.svelte';
</script>

{#if toast.toasts.length > 0}
	<div class="toast-container">
		{#each toast.toasts as toastItem (toastItem.id)}
			<Toast toast={toastItem} onDismiss={(id) => toast.dismiss(id)} />
		{/each}
	</div>
{/if}

<style>
	.toast-container {
		position: fixed;
		top: var(--sm);
		left: 50%;
		transform: translateX(-50%);
		z-index: var(--z-toast);
		display: flex;
		flex-direction: column;
		gap: var(--xxs);
		pointer-events: none;

		& > :global(*) {
			pointer-events: auto;
		}
	}

	@media (max-width: 768px) {
		.toast-container {
			left: var(--xs);
			right: var(--xs);
			transform: none;
			width: calc(100% - var(--sm));
		}
	}
</style>
