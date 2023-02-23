import { Theme } from '@nivo/core';

export const theme: Theme = {
	textColor: '#ede8f2',
	fontFamily: 'Inter',
	fontSize: 14,
	tooltip: {
		container: {
			backgroundColor: '#100a1c',
			padding: 7,
			border: '1px solid #ede8f2',
			borderRadius: 10,
			boxShadow: '0 0 11px #100a1c',
		},
		chip: {
			padding: 0,
			marginTop: 5,
			marginRight: -3,
			borderRadius: 100,
		},
	},
	axis: {
		ticks: {
			text: {
				color: '#ede8f2',
				fontFamily: 'Inter',
				fontSize: 14,
			},
		},
	},
	crosshair: {
		line: {
			stroke: '#ede8f2',
		},
	},
};
