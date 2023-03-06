import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

interface ReadAuthCodeFromQueryStringProps {
	children: React.ReactNode;
}

export const SaveAuthCodeFromQueryString = ({
	children,
}: ReadAuthCodeFromQueryStringProps): JSX.Element => {
	const [searchParams, setSearchParams] = useSearchParams();

	// We need to set here on initial render so that we definitely capture the code if we're receiving an auth redirect.
	// Otherwise we get an extra loop through the OAuth flow because local storage gets set too late.
	if (searchParams.has('code') && searchParams.has('scope') && searchParams.has('session_state')) {
		// Ok, we're definitely receiving an auth redirect from Xero or something that acts like Xero.
		// Let's read the code and put it in local storage so we can send it to the server.
		localStorage.setItem('graphweaver-auth', window.location.href);
	}

	// This needs to be in a useEffect because it causes side effects (the setSearchParams call below)
	useEffect(
		() => {
			if (
				searchParams.has('code') &&
				searchParams.has('scope') &&
				searchParams.has('session_state')
			) {
				// Ok, we've saved it, strip the params back out so we don't have the noise in the URL.
				searchParams.delete('code');
				searchParams.delete('scope');
				searchParams.delete('session_state');

				setSearchParams({ ...searchParams });
			}
		},
		[
			// Yes, you could argue that searchParams is a dependency here, but the flow back from an OAuth provider
			// is always on initial render. We don't really want to trigger this logic if the search params change
			// while the user remains on the page, so we're not declaring any dependencies here.
		]
	);

	return <>{children}</>;
};
