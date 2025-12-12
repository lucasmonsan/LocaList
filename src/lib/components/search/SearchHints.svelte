<script>
	import { fade, slide } from 'svelte/transition';
	const hints = ['Busque pela rua, bairro, cidade ou ponto turístico.', 'Empresas e comércios também podem ser encontrados.', 'Rua sem numeração? Só adicionar na sua análise.'];
</script>

<div style="box-shadow: var(--shadow-black);" transition:fade={{ duration: 250 }}>
	<div transition:slide={{ axis: 'y' }}>
		<p>💡 Dicas de pesquisa:</p>
		<ul>
			{#each hints as hint}
				<li>{hint}</li>
			{/each}
		</ul>
	</div>
</div>

<style>
	div {
		display: flex;
		flex-direction: column;
		gap: var(--xxxs);
		width: 100%;
		padding: var(--xxs);
		border-radius: var(--radius-2);
		background: var(--surface);
	}

	p {
		width: 100%;
		margin: var(--xxxs) 0;
		font-size: calc(var(--xs) * 1.15);
		color: var(--text-secondary);
		text-transform: uppercase;
		font-weight: 800;
		opacity: 0.75;
	}

	ul {
		padding-left: var(--xxxs);
		list-style-position: inside;
	}

	li {
		padding: var(--xxxs) 0;
		margin: 0;
		font-size: calc(var(--xs) * 1.1);
		font-weight: 500;
		color: var(--text-secondary);
	}
</style>
