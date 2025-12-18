<script>
	import { defaultSEO } from '$lib/utils/seo';
</script>

<svelte:head>
	<title>{defaultSEO.title}</title>
	<meta name="description" content={defaultSEO.description} />
	<meta name="keywords" content={defaultSEO.keywords?.join(', ')} />

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://map.monsan.duckdns.org" />
	<meta property="og:title" content={defaultSEO.title} />
	<meta property="og:description" content={defaultSEO.description} />
	<meta property="og:image" content="https://map.monsan.duckdns.org/og-image.png" />
	<meta property="og:site_name" content="Monsan Map" />
	<meta property="og:locale" content="pt_BR" />

	<!-- Twitter -->
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:url" content="https://map.monsan.duckdns.org" />
	<meta property="twitter:title" content={defaultSEO.title} />
	<meta property="twitter:description" content={defaultSEO.description} />
	<meta property="twitter:image" content="https://map.monsan.duckdns.org/og-image.png" />

	<!-- Additional SEO -->
	<meta name="robots" content="index, follow" />
	<meta name="googlebot" content="index, follow" />
	<link rel="canonical" href="https://map.monsan.duckdns.org" />
</svelte:head>

<style>
</style>
