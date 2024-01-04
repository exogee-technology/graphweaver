import { processFormValues } from './util';

describe('processFormValues', () => {
	it('should process the form values correctly', () => {
		const formValues = {
			id: '1',
			title: 'For Those About To Rock We Salute 2',
			artist: {
				__typename: 'Artist',
				value: '1',
				label: 'AC/DC',
			},
			tracks: [
				{
					__typename: 'Track',
					value: '1',
					label: 'For Those About To Rock (We Salute You)',
				},
				{
					__typename: 'Track',
					value: '6',
					label: 'Put The Finger On You',
				},
				{
					__typename: 'Track',
					value: '7',
					label: "Let's Get It Up",
				},
				{
					__typename: 'Track',
					value: '8',
					label: 'Inject The Venom',
				},
				{
					__typename: 'Track',
					value: '9',
					label: 'Snowballed',
				},
				{
					__typename: 'Track',
					value: '10',
					label: 'Evil Walks',
				},
				{
					__typename: 'Track',
					value: '11',
					label: 'C.O.D.',
				},
				{
					__typename: 'Track',
					value: '12',
					label: 'Breaking The Rules',
				},
				{
					__typename: 'Track',
					value: '13',
					label: 'Night Of The Long Knives',
				},
				{
					__typename: 'Track',
					value: '14',
					label: 'Spellbound',
				},
			],
		};

		const expected = {
			id: '1',
			title: 'For Those About To Rock We Salute 2',
			artist: {
				id: '1',
			},
			tracks: [
				{
					id: '1',
				},
				{
					id: '6',
				},
				{
					id: '7',
				},
				{
					id: '8',
				},
				{
					id: '9',
				},
				{
					id: '10',
				},
				{
					id: '11',
				},
				{
					id: '12',
				},
				{
					id: '13',
				},
				{
					id: '14',
				},
			],
		};

		expect(processFormValues(formValues)).toEqual(expected);
	});
});
