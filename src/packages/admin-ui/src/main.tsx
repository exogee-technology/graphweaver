import React from 'react';
import ReactDOM from 'react-dom/client';
import { Home } from './pages/home';

import './reset.css';
import './main.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<Home hasData />
	</React.StrictMode>
);
