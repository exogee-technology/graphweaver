import { create } from 'storybook/theming';

export default create({
	base: 'dark',
	brandTitle: 'Graphweaver UI Components',
	brandUrl: 'https://graphweaver.com',
	brandImage: 'https://graphweaver.com/img/graphweaver-logo.svg',
	brandTarget: '_self',
	//
	colorPrimary: '#7038c2',
	colorSecondary: '#853af2',

	// UI
	appBg: '#171221',
	appContentBg: '#100a1c',
	appPreviewBg: '#100a1c',
	appBorderColor: '#585C6D',
	appBorderRadius: 4,

	fontBase: '"Inter", sans-serif',
	fontCode: 'monospace',

	// Text colors
	textColor: '#ede8f2',
	textInverseColor: '#ffffff',

	// Toolbar default and active colors
	barTextColor: '#9E9E9E',
	barSelectedColor: '#585C6D',
	barHoverColor: '#585C6D',
	barBg: '#ede8f221',

	// Form colors
	inputBg: '#ede8f221',
	inputBorder: '#10162F',
	inputTextColor: '#10162F',
	inputBorderRadius: 2,
});
