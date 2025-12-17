import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { StorageService } from '$lib/services/storage.service';
import { logger } from '$lib/utils/logger';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		// Check if user is authenticated
		const session = await locals.getSession();
		if (!session) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const formData = await request.formData();
		const originalFile = formData.get('original') as File;
		const thumbnailFile = formData.get('thumbnail') as File;
		const pinId = formData.get('pinId') as string;

		if (!originalFile || !thumbnailFile || !pinId) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		const urls = await StorageService.uploadPinPhoto(originalFile, thumbnailFile, pinId);

		return json(urls);
	} catch (error) {
		logger.error('Upload error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Upload failed' },
			{ status: 500 }
		);
	}
};

