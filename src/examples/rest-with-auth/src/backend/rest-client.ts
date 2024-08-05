import got from 'got-cjs';

const baseUrl = process.env.REST_BASE_URL;

export const fetch = async <T>(path: string) => {
	try {
		return await got.get(`${baseUrl}${path}`).json<T[]>();
	} catch (error) {
		console.error(`Failed to fetch data from ${path}:`, error);
		throw error;
	}
};
