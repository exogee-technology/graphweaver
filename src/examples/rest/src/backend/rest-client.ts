import got from 'got-cjs';

const baseUrl = process.env.REST_BASE_URL;

export const fetch = async <T>(path: string) => {
	return got.get(`${baseUrl}${path}`).json<T[]>();
};
