import got from 'got-cjs';

export const fetch = async <T>(path: string) =>
	got.get(`https://swapi.info/api${path}`).json<T[]>();
