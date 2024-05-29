import { describe, it, expect } from 'vitest';
import { mapFormikValuesToGqlRequestValues } from './util';
import { Entity } from '../utils';

const entityMetadataStubs: Record<string, Entity> = {
	Album: {
		name: 'Album',
		plural: 'Albums',
		primaryKeyField: 'albumId',
		backendId: 'who-cares',
		fields: [],
		attributes: {},
	},
	Artist: {
		name: 'Artist',
		plural: 'Artists',
		primaryKeyField: 'artistId',
		backendId: 'who-cares',
		fields: [],
		attributes: {},
	},
	Track: {
		name: 'Track',
		plural: 'Tracks',
		primaryKeyField: 'trackId',
		backendId: 'who-cares',
		fields: [],
		attributes: {},
	},
};

const getEntityByName = (name: string) => entityMetadataStubs[name];

describe('mapFormikValuesToGqlRequestValues', () => {
	it('Should replace objects representing related entities with an object containing just an ID field', () => {
		const formValues = {
			albumId: '1',
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
			albumId: '1',
			title: 'For Those About To Rock We Salute 2',
			artist: {
				artistId: '1',
			},
			tracks: [
				{
					trackId: '1',
				},
				{
					trackId: '6',
				},
				{
					trackId: '7',
				},
				{
					trackId: '8',
				},
				{
					trackId: '9',
				},
				{
					trackId: '10',
				},
				{
					trackId: '11',
				},
				{
					trackId: '12',
				},
				{
					trackId: '13',
				},
				{
					trackId: '14',
				},
			],
		};
		expect(
			mapFormikValuesToGqlRequestValues(entityMetadataStubs['Album'], getEntityByName, formValues)
		).toEqual(expected);
	});
});
