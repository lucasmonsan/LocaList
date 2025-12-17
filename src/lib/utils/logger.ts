class Logger {
	private isDev = import.meta.env.DEV;

	debug(message: string, context?: any) {
		if (this.isDev) {
			console.log(`[DEBUG]`, message, context || '');
		}
	}

	info(message: string, context?: any) {
		if (this.isDev) {
			console.info(`[INFO]`, message, context || '');
		}
	}

	warn(message: string, context?: any) {
		console.warn(`[WARN]`, message, context || '');
	}

	error(message: string, error?: any) {
		console.error(`[ERROR]`, message, error || '');
		
		if (!this.isDev && typeof window !== 'undefined') {
			// TODO: integrar Sentry
		}
	}
}

export const logger = new Logger();

