const SENSITIVE_KEYS = new Set(['token', 'password', 'secret', 'accessToken', 'refreshToken']);

export const sanitiseFilterForLogging = (filter: any): any => {
	if (filter == null || typeof filter !== 'object') return filter;

	// Handle arrays
	if (Array.isArray(filter)) {
		return filter.map((item) => sanitiseFilterForLogging(item));
	}

	// Object: shallow copy with redaction
	const sanitised: any = {};

	for (const key of Object.keys(filter)) {
		if (SENSITIVE_KEYS.has(key)) {
			sanitised[key] = '[REDACTED]';
		} else if (filter[key] && typeof filter[key] === 'object') {
			sanitised[key] = sanitiseFilterForLogging(filter[key]);
		} else {
			sanitised[key] = filter[key];
		}
	}

	return sanitised;
};
