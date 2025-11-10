import pino from 'pino';

const validLevels = {
	warn: true,
	trace: true,
	debug: true,
	info: true,
	error: true,
	fatal: true,
};

type LoggingLevel = keyof typeof validLevels;
const level: LoggingLevel = (process.env.LOGGING_LEVEL as LoggingLevel) || 'info';

if (!validLevels[level])
	throw new Error(
		`Invalid logging level ${level}, valid levels are ${Object.keys(validLevels).join(', ')}`
	);

export const logger = pino({
	name: 'graphweaver',
	level,
});

/**
 * Safely logs an error, converting non-Error objects to strings to avoid
 * serializing function source code from dependencies (like minified Knex.js code).
 *
 * @param logger - The pino logger instance
 * @param error - The error to log (can be Error, string, or any other value)
 * @param context - Optional context message to include in the log
 */
export function safeErrorLog(logger: pino.Logger, error: unknown, context?: string): void {
	if (error instanceof Error) {
		if (context) {
			logger.error(error, context);
		} else {
			logger.error(error);
		}
	} else {
		// Safely extract message without serializing functions
		const message =
			(error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
				? error.message
				: null) ||
			(typeof error?.toString === 'function' ? error.toString() : null) ||
			String(error);

		const logMessage = context ? `${context}: ${message}` : message;
		logger.error({ err: error }, logMessage);
	}
}
