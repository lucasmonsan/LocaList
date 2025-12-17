<script lang="ts">
	import { Star, ThumbsUp, Flag } from 'lucide-svelte';
	import { authState } from '$lib/stores/auth.svelte';
	import { PinsService } from '$lib/services/pins.service';
	import { haptics } from '$lib/utils/haptics';
	import { toast } from '$lib/components/toast/toast.svelte';
	import { i18n } from '$lib/i18n/i18n.svelte';
	import { formatRelativeTime } from '$lib/utils/time';
	import type { ReviewWithUser } from '$lib/types/database.types';

	interface Props {
		review: ReviewWithUser;
		onUpdate?: () => void;
	}

	let { review, onUpdate }: Props = $props();

	let isUpvoted = $derived(review.user_upvoted ?? false);
	let upvoteCount = $derived(review.upvotes_count ?? review.upvotes ?? 0);
	let upvoteLoading = $state(false);

	async function handleUpvote() {
		if (!authState.user) {
			toast.error(i18n.t.errors.loginRequired);
			return;
		}

		if (upvoteLoading) return;

		upvoteLoading = true;
		haptics.light();

		try {
			const newState = await PinsService.toggleReviewUpvote(review.id, authState.user.id);

			isUpvoted = newState;
			upvoteCount = newState ? upvoteCount + 1 : upvoteCount - 1;
		} catch (error) {
			toast.error('Erro ao votar');
		} finally {
			upvoteLoading = false;
		}
	}

	async function handleReport() {
		if (!authState.user) {
			toast.error(i18n.t.errors.loginRequired);
			return;
		}

		if (!confirm('Deseja reportar esta avaliação por conteúdo inapropriado?')) {
			return;
		}

		try {
			await PinsService.reportReview(review.id, authState.user.id);
			toast.success('Avaliação reportada com sucesso');
			haptics.success();
		} catch (error: any) {
			if (error.message?.includes('já reportou')) {
				toast.info('Você já reportou esta avaliação');
			} else {
				toast.error('Erro ao reportar avaliação');
			}
		}
	}
</script>

<article class="review-item">
	<header>
		<div class="user-info">
			<img src={review.user_avatar || review.user?.avatar_url || '/default-avatar.png'} alt={review.user_name || review.user?.full_name || 'User'} class="avatar" />
			<div>
				<strong>{review.user_name || review.user?.full_name || 'Anônimo'}</strong>
				<time>{formatRelativeTime(new Date(review.created_at).getTime())}</time>
			</div>
		</div>

		<div class="rating">
			{#each Array(5) as _, i}
				<Star size={14} fill={i < review.rating ? 'currentColor' : 'none'} />
			{/each}
		</div>
	</header>

	{#if review.comment}
		<p class="comment">{review.comment}</p>
	{/if}

	{#if review.photos && review.photos.length > 0}
		<div class="photos">
			{#each review.photos as photo}
				<img src={photo} alt="Foto da avaliação" />
			{/each}
		</div>
	{/if}

	<footer>
		<button class="upvote-button" class:active={isUpvoted} onclick={handleUpvote} disabled={upvoteLoading} aria-label="Útil">
			<ThumbsUp size={16} fill={isUpvoted ? 'currentColor' : 'none'} />
			<span>{upvoteCount}</span>
		</button>

		<button class="report-button" onclick={handleReport} aria-label="Reportar">
			<Flag size={16} />
		</button>
	</footer>
</article>

<style>
	.review-item {
		background: var(--surface);
		border-radius: var(--radius-in);
		padding: var(--md);
		display: flex;
		flex-direction: column;
		gap: var(--xs);
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: var(--xs);
	}

	.avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		object-fit: cover;
		background: var(--bg);
	}

	.user-info div {
		display: flex;
		flex-direction: column;
	}

	.user-info strong {
		font-size: var(--sm);
		font-weight: 600;
		color: var(--text-primary);
	}

	.user-info time {
		font-size: var(--xs);
		color: var(--text-secondary);
	}

	.rating {
		display: flex;
		gap: 2px;
		color: var(--warning);
	}

	.comment {
		font-size: var(--sm);
		color: var(--text-primary);
		line-height: 1.5;
		margin: 0;
	}

	.photos {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
		gap: var(--xs);
		margin-top: var(--xs);
	}

	.photos img {
		width: 100%;
		height: 80px;
		object-fit: cover;
		border-radius: var(--radius-in);
		background: var(--bg);
		cursor: pointer;
		transition: all var(--fast);
	}

	.photos img:hover {
		transform: scale(1.05);
		box-shadow: var(--shadow-md);
	}

	footer {
		display: flex;
		gap: var(--xs);
		margin-top: var(--xs);
		padding-top: var(--xs);
		border-top: 1px solid var(--border-color);
	}

	footer button {
		display: flex;
		align-items: center;
		gap: var(--xxxs);
		padding: var(--xxs) var(--xs);
		background: var(--bg);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-in);
		font-size: var(--xs);
		color: var(--text-secondary);
		cursor: pointer;
		transition: all var(--fast);
	}

	footer button:hover {
		background: var(--bg-2);
		color: var(--text-primary);
	}

	footer button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.upvote-button.active {
		color: var(--brand-primary);
		border-color: var(--brand-primary);
		background: var(--brand-primary-alpha);
	}

	.report-button {
		margin-left: auto;
	}

	.report-button:hover {
		color: var(--error);
		border-color: var(--error);
	}
</style>
