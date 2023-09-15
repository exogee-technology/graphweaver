import React from 'react';
import { createRoot } from 'react-dom/client';
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from '@exogee/graphweaver-admin-ui-components';

import { Router } from './router';

import './reset.css';
import './main.css';

createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<ApolloProvider client={apolloClient}>
			<Router />
		</ApolloProvider>
	</React.StrictMode>
);
