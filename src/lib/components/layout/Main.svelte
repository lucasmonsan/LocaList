<script>
	let { children } = $props();
</script>

<main>
	{@render children()}
</main>

<style>
	main {
		width: 100%;
		height: 100dvh;
	}
</style>
