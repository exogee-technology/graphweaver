import type { Preview } from '@storybook/react-vite';
import './main.css';
import theme from './theme';
const preview: Preview = {
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
		docs: {
			theme,
		},
	},
};

export default preview;
