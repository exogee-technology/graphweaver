import { Serializer } from '@exogee/graphweaver-rest/lib/serializers';
import got from 'got-cjs';

export const fetch = async <T>(path: string) =>
	got.get(`https://swapi.info/api${path}`).json<T[]>();

const extractIdFromSwapiUrl = (url: string) => {
	const parsedUrl = new URL(url);
	const [_, __, id] = parsedUrl.pathname.split('/');
	return id;
};

export const foreignKeySerializer: Serializer = {
	toCrm: (value) => value,
	fromCrm: (value) => {
		if (Array.isArray(value)) {
			return value.map(extractIdFromSwapiUrl);
		}
		if (typeof value === 'string') {
			return extractIdFromSwapiUrl(value);
		}

		return value;
	},
};
