export const formatRedirectUrl = (url: string): string => {
	const parsedUrl = new URL(url);
	const currentLocation = window.location;

	if (parsedUrl.hostname === currentLocation.hostname) {
		const pathAndSearchParams = parsedUrl.pathname + parsedUrl.search;
		return pathAndSearchParams;
	}
	return url;
};
