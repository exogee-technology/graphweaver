export const formatRedirectUrl = (url: string): string => {
	const parsedUrl = new URL(url);
	const currentLocation = window.location;

	if (parsedUrl.hostname === currentLocation.hostname) {
		if (parsedUrl.pathname === currentLocation.pathname) {
			// If the pathname is the same, then the redirect is to the same page, so we should just return the root path
			return '/';
		}
		return parsedUrl.pathname + parsedUrl.search;
	}
	return url;
};
