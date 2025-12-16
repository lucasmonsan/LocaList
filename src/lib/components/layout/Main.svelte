<script>
	let { children } = $props();
</script>

<main>
	{@render children()}
</main>

<style>
	main {
		z-index: var(--z-page);
		position: absolute;
		top: 0;
		left: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100dvh;
		pointer-events: none;
		user-select: none;

		:global(> *) {
			pointer-events: auto;
		}
	}
</style>
