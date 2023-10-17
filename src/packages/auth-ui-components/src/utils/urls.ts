export const formatRedirectUrl = (url: string): string => {
	const parsedUrl = new URL(url);
	const currentLocation = window.location;

	if (parsedUrl.hostname === currentLocation.hostname) {
		return parsedUrl.pathname + parsedUrl.search;
	}
	return url;
};
