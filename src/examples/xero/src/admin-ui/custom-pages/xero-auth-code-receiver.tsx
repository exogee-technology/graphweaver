import { useSearchParams, Navigate } from 'react-router-dom';

export const XeroAuthCodeReceiver = () => {
	const [searchParams] = useSearchParams();
	// We need to set here on initial render so that we definitely capture the code if we're receiving an auth redirect.
	// Otherwise we get an extra loop through the OAuth flow because local storage gets set too late.
	if (
		!searchParams.has('code') ||
		!searchParams.has('scope') ||
		!searchParams.has('session_state')
	) {
		return (
			<p>
				Error: Invalid response from Xero, expected to have a code, scope and session_state in the
				url.
			</p>
		);
	}

	// Ok, we're definitely receiving an auth redirect from Xero or something that acts like Xero.
	// Let's read the code and put it in local storage so we can send it to the server.
	localStorage.setItem('graphweaver-auth', window.location.href);

	// Ok, now that we've saved it we're good to go.
	return <Navigate to="/" />;
};
