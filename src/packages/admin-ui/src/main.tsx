import React from 'react';
import { createRoot } from 'react-dom/client';
import { ApolloProvider } from '@apollo/client';
import { apolloClient, DismissibleToast } from '@exogee/graphweaver-admin-ui-components';

import { Router } from './router';

import './assets/reset.css';
import './assets/main.css';

createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<ApolloProvider client={apolloClient}>
			<Router />
			<DismissibleToast />
		</ApolloProvider>
	</React.StrictMode>
);
