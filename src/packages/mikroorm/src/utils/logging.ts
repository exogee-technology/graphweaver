const SENSITIVE_KEYS = new Set(['token', 'password', 'secret', 'accessToken', 'refreshToken']);

export const sanitiseFilterForLogging = (
	filter: any,
	visited: WeakSet<object> = new WeakSet()
): any => {
	if (filter == null || typeof filter !== 'object') return filter;

	// Check if we've already processed this object to prevent circular references
	if (visited.has(filter)) {
		return '[Circular Reference]';
	}

	// Add current object to visited set
	visited.add(filter);

	// Handle arrays
	if (Array.isArray(filter)) {
		return filter.map((item) => sanitiseFilterForLogging(item, visited));
	}

	// Object: shallow copy with redaction
	const sanitised: any = {};

	for (const key of Object.keys(filter)) {
		if (SENSITIVE_KEYS.has(key)) {
			sanitised[key] = '[REDACTED]';
		} else if (filter[key] && typeof filter[key] === 'object') {
			sanitised[key] = sanitiseFilterForLogging(filter[key], visited);
		} else {
			sanitised[key] = filter[key];
		}
	}

	return sanitised;
};
