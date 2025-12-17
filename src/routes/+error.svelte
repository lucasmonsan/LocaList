<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { AlertTriangle } from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';

	let errorMessage = $derived($page.error?.message || 'Algo deu errado');
	let statusCode = $derived($page.status || 500);
</script>

<div class="error-page">
	<div class="error-content">
		<div class="error-icon">
			<AlertTriangle size={64} />
		</div>
		
		<h1>{statusCode}</h1>
		<p class="error-message">{errorMessage}</p>
		
		<div class="actions">
			<Button variant="primary" onclick={() => goto('/')}>
				Voltar ao início
			</Button>
			<Button variant="ghost" onclick={() => window.location.reload()}>
				Recarregar página
			</Button>
		</div>
	</div>
</div>

<style>
	.error-page {
		position: fixed;
		inset: 0;
		z-index: var(--z-splash);
		background: var(--bg);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--lg);
	}

	.error-content {
		max-width: 500px;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--md);
	}

	.error-icon {
		color: var(--error);
	}

	h1 {
		font-size: 4rem;
		font-weight: 800;
		color: var(--text-primary);
		margin: 0;
		line-height: 1;
	}

	.error-message {
		font-size: var(--lg);
		color: var(--text-secondary);
		margin: 0;
		line-height: 1.5;
	}

	.actions {
		display: flex;
		gap: var(--xs);
		margin-top: var(--md);
	}

	@media (max-width: 768px) {
		h1 {
			font-size: 3rem;
		}

		.error-message {
			font-size: var(--md);
		}

		.actions {
			flex-direction: column;
			width: 100%;
		}
	}
</style>

