<script>
	let { children } = $props();
</script>

<main>
	{@render children()}
</main>

<style>
	main {
		width: 95%;
		height: 95dvh;
		border: solid red;
	}
</style>
