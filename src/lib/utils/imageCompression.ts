import imageCompression from 'browser-image-compression';

export interface CompressedImages {
	main: File;
	thumbnail: File;
}

const COMPRESSION_OPTIONS = {
	maxSizeMB: 0.5, // 500 KB max
	maxWidthOrHeight: 1200,
	useWebWorker: true,
	fileType: 'image/webp',
	initialQuality: 0.8
};

const THUMBNAIL_OPTIONS = {
	maxSizeMB: 0.05, // 50 KB max
	maxWidthOrHeight: 300,
	useWebWorker: true,
	fileType: 'image/webp',
	initialQuality: 0.75
};

/**
 * Compress image for upload
 */
export async function compressImage(file: File): Promise<File> {
	try {
		// Check if WebP is supported
		const supportsWebP = await checkWebPSupport();
		
		const options = {
			...COMPRESSION_OPTIONS,
			fileType: supportsWebP ? 'image/webp' : 'image/jpeg'
		};

		const compressed = await imageCompression(file, options);
		
		// Rename file to have correct extension
		const extension = supportsWebP ? 'webp' : 'jpg';
		const newFileName = file.name.replace(/\.[^/.]+$/, `.${extension}`);
		
		return new File([compressed], newFileName, {
			type: compressed.type,
			lastModified: Date.now()
		});
	} catch (error) {
		throw new Error('Failed to compress image');
	}
}

/**
 * Generate thumbnail from image
 */
export async function generateThumbnail(file: File): Promise<File> {
	const supportsWebP = await checkWebPSupport();
	
	const options = {
		...THUMBNAIL_OPTIONS,
		fileType: supportsWebP ? 'image/webp' : 'image/jpeg'
	};

	const thumbnail = await imageCompression(file, options);
	
	const extension = supportsWebP ? 'webp' : 'jpg';
	const newFileName = file.name.replace(/\.[^/.]+$/, `_thumb.${extension}`);
	
	return new File([thumbnail], newFileName, {
		type: thumbnail.type,
		lastModified: Date.now()
	});
}

/**
 * Compress image and generate thumbnail
 */
export async function processImage(file: File): Promise<CompressedImages> {
	// Validate file type
	if (!file.type.startsWith('image/')) {
		throw new Error('File must be an image');
	}

	// Validate file size (max 10 MB before compression)
	const maxSize = 10 * 1024 * 1024; // 10 MB
	if (file.size > maxSize) {
		throw new Error('Image must be smaller than 10 MB');
	}

	const [main, thumbnail] = await Promise.all([
		compressImage(file),
		generateThumbnail(file)
	]);

	return { main, thumbnail };
}

/**
 * Check if browser supports WebP
 */
async function checkWebPSupport(): Promise<boolean> {
	if (typeof document === 'undefined') return false;

	return new Promise((resolve) => {
		const img = new Image();
		img.onload = () => resolve(img.width === 1);
		img.onerror = () => resolve(false);
		img.src = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';
	});
}

/**
 * Get image dimensions
 */
export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => {
			resolve({ width: img.width, height: img.height });
		};
		img.onerror = reject;
		img.src = URL.createObjectURL(file);
	});
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

