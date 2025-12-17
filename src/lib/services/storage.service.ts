import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import {
	R2_ACCOUNT_ID,
	R2_ACCESS_KEY_ID,
	R2_SECRET_ACCESS_KEY,
	R2_BUCKET_NAME
} from '$env/static/private';
import { PUBLIC_R2_PUBLIC_URL } from '$env/static/public';

const s3Client = new S3Client({
	region: 'auto',
	endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
	credentials: {
		accessKeyId: R2_ACCESS_KEY_ID,
		secretAccessKey: R2_SECRET_ACCESS_KEY
	}
});

export class StorageService {
	/**
	 * Upload file to Cloudflare R2
	 */
	static async uploadFile(
		file: File,
		path: string,
		contentType: string
	): Promise<string> {
		try {
			const buffer = await file.arrayBuffer();

			const command = new PutObjectCommand({
				Bucket: R2_BUCKET_NAME,
				Key: path,
				Body: new Uint8Array(buffer),
				ContentType: contentType,
				CacheControl: 'public, max-age=31536000, immutable'
			});

			await s3Client.send(command);

			// Return public URL
			return `${PUBLIC_R2_PUBLIC_URL}/${path}`;
		} catch (error) {
			throw new Error('Failed to upload file');
		}
	}

	/**
	 * Delete file from Cloudflare R2
	 */
	static async deleteFile(path: string): Promise<void> {
		try {
			const command = new DeleteObjectCommand({
				Bucket: R2_BUCKET_NAME,
				Key: path
			});

			await s3Client.send(command);
		} catch (error) {
			throw new Error('Failed to delete file');
		}
	}

	/**
	 * Upload pin photo (original + thumbnail)
	 */
	static async uploadPinPhoto(
		originalFile: File,
		thumbnailFile: File,
		pinId: string
	): Promise<{ original: string; thumbnail: string }> {
		const timestamp = Date.now();
		const originalExt = originalFile.name.split('.').pop();
		const thumbnailExt = thumbnailFile.name.split('.').pop();

		const originalPath = `pins/${pinId}/${timestamp}.${originalExt}`;
		const thumbnailPath = `pins/${pinId}/${timestamp}_thumb.${thumbnailExt}`;

		const [originalUrl, thumbnailUrl] = await Promise.all([
			this.uploadFile(originalFile, originalPath, originalFile.type),
			this.uploadFile(thumbnailFile, thumbnailPath, thumbnailFile.type)
		]);

		return {
			original: originalUrl,
			thumbnail: thumbnailUrl
		};
	}

	/**
	 * Delete pin photo (original + thumbnail)
	 */
	static async deletePinPhoto(photoUrl: string): Promise<void> {
		try {
			// Extract path from URL
			const url = new URL(photoUrl);
			const path = url.pathname.substring(1); // Remove leading slash

			// Delete original
			await this.deleteFile(path);

			// Delete thumbnail if exists
			const thumbnailPath = path.replace(/\.(jpg|jpeg|png|webp)$/, '_thumb.$1');
			try {
				await this.deleteFile(thumbnailPath);
			} catch (err) {
				// Thumbnail might not exist, ignore error
			}
		} catch (error) {
			throw error;
		}
	}
}

