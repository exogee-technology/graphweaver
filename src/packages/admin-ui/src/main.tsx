import React from 'react';
import { createRoot } from 'react-dom/client';

import { Router } from './router';

import './reset.css';
import './main.css';

createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<Router />
	</React.StrictMode>
);
