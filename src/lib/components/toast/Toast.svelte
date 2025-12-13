<script lang="ts">
	import type { Toast as ToastType } from '$lib/types/toast.types';
	import { fly } from 'svelte/transition';
	import CrossIcon from '$lib/icons/CrossIcon.svelte';

	interface Props {
		toast: ToastType;
		onDismiss: (id: string) => void;
	}

	let { toast, onDismiss }: Props = $props();

	const icons = {
		success: '✅',
		error: '❌',
		info: 'ℹ️',
		warning: '⚠️'
	};
</script>

<div class="toast {toast.type}" role="alert" aria-live="polite" in:fly={{ y: -20, duration: 300 }} out:fly={{ y: -20, duration: 200 }}>
	<span class="icon">{icons[toast.type]}</span>
	<p>{toast.message}</p>
	<button class="close" onclick={() => onDismiss(toast.id)} aria-label="Fechar notificação">
		<CrossIcon />
	</button>
</div>

<style>
	.toast {
		display: flex;
		align-items: center;
		gap: var(--xs);
		min-width: 300px;
		max-width: 500px;
		padding: var(--xs) var(--sm);
		border-radius: var(--radius-in);
		box-shadow: var(--shadow-lg);
		background: var(--surface);
		border: 2px solid;
		animation: slideIn 0.3s ease-out;

		&.success {
			border-color: var(--success);
		}

		&.error {
			border-color: var(--error);
		}

		&.info {
			border-color: var(--brand-primary);
		}

		&.warning {
			border-color: var(--warning);
		}
	}

	.icon {
		font-size: var(--lg);
		flex-shrink: 0;
	}

	p {
		flex: 1;
		margin: 0;
		font-size: var(--sm);
		font-weight: 600;
		color: var(--text-primary);
		line-height: 1.4;
	}

	.close {
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--lg);
		height: var(--lg);
		padding: 0;
		background: transparent;
		border: none;
		border-radius: var(--radius-in);
		cursor: pointer;
		color: var(--text-secondary);
		transition: all var(--fast);
		flex-shrink: 0;

		&:hover {
			background: var(--bg);
			color: var(--text-primary);
		}
	}

	@keyframes slideIn {
		from {
			transform: translateY(-100%);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}
</style>
