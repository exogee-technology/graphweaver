import { Configuration, PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { PropsWithChildren } from 'react';

const configuration: Configuration = {
	auth: {
		clientId: import.meta.env.VITE_MICROSOFT_ENTRA_CLIENT_ID,
		authority: import.meta.env.VITE_MICROSOFT_ENTRA_TENANT_ID
			? `https://login.microsoftonline.com/${import.meta.env.VITE_MICROSOFT_ENTRA_TENANT_ID}`
			: undefined,
	},
};

export const publicClientApplication = new PublicClientApplication(configuration);

export const MicrosoftEntraProvider = ({ children }: PropsWithChildren) => (
	<MsalProvider instance={publicClientApplication}>{children}</MsalProvider>
);
