import bunyan from 'bunyan';

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

export const logger = bunyan.createLogger({
	name: 'nscc-easy',
	level,
});