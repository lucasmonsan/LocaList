<script lang="ts">
	import { onMount } from 'svelte';
	import { Activity } from 'lucide-svelte';

	interface Props {
		show?: boolean;
	}

	let { show = false }: Props = $props();

	let fps = $state(0);
	let memory = $state(0);
	let showStats = $derived(show);
	let lastTime = 0;
	let frames = 0;

	onMount(() => {
		// FPS Counter
		const updateFPS = (currentTime: number) => {
			frames++;
			if (currentTime >= lastTime + 1000) {
				fps = Math.round((frames * 1000) / (currentTime - lastTime));
				lastTime = currentTime;
				frames = 0;
			}
			requestAnimationFrame(updateFPS);
		};
		requestAnimationFrame(updateFPS);

		// Memory usage (apenas Chrome/Edge)
		const updateMemory = () => {
			if ('memory' in performance) {
				const mem = (performance as any).memory;
				memory = Math.round(mem.usedJSHeapSize / 1048576); // MB
			}
		};

		const memoryInterval = setInterval(updateMemory, 1000);

		// Toggle com Ctrl+Shift+M ou query param ?debug=true
		const urlParams = new URLSearchParams(window.location.search);
		if (urlParams.get('debug') === 'true') {
			showStats = true;
		}

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.ctrlKey && e.shiftKey && e.key === 'M') {
				e.preventDefault();
				showStats = !showStats;
			}
		};
		window.addEventListener('keydown', handleKeyDown);

		return () => {
			clearInterval(memoryInterval);
			window.removeEventListener('keydown', handleKeyDown);
		};
	});
</script>

{#if showStats}
	<div class="perf-monitor">
		<div class="header">
			<Activity size={14} />
			<span>Performance</span>
		</div>
		<div class="stats">
			<div class="stat">
				<span class="label">FPS:</span>
				<span class="value" class:warning={fps < 30} class:error={fps < 20}>{fps}</span>
			</div>
			{#if memory > 0}
				<div class="stat">
					<span class="label">RAM:</span>
					<span class="value" class:warning={memory > 100} class:error={memory > 200}>{memory}MB</span>
				</div>
			{/if}
		</div>
		<div class="hint">Ctrl+Shift+M para alternar</div>
	</div>
{/if}

<style>
	.perf-monitor {
		position: fixed;
		top: var(--xs);
		right: var(--xs);
		z-index: 9999;
		background: rgba(0, 0, 0, 0.9);
		color: #0f0;
		padding: var(--xs);
		border-radius: var(--radius-in);
		font-family: monospace;
		font-size: 11px;
		min-width: 120px;
		backdrop-filter: blur(10px);
		border: 1px solid rgba(0, 255, 0, 0.2);
	}

	.header {
		display: flex;
		align-items: center;
		gap: var(--xxxs);
		margin-bottom: var(--xxs);
		font-weight: 600;
		color: #0f0;
	}

	.stats {
		display: flex;
		flex-direction: column;
		gap: var(--xxxs);
	}

	.stat {
		display: flex;
		justify-content: space-between;
		gap: var(--xs);
	}

	.label {
		color: #888;
	}

	.value {
		color: #0f0;
		font-weight: 600;
	}

	.value.warning {
		color: #ff0;
	}

	.value.error {
		color: #f00;
	}

	.hint {
		margin-top: var(--xxs);
		padding-top: var(--xxs);
		border-top: 1px solid rgba(0, 255, 0, 0.1);
		color: #666;
		font-size: 9px;
	}
</style>

