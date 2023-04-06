import got from 'got';

const baseUrl = process.env.REST_BASE_URL;

export const fetch = async <T>(path: string) => {
	return got.get(`${baseUrl}${path}`).json<{
		count: number;
		results: T[];
	}>();
};
