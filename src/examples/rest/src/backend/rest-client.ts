import got from 'got';

const baseUrl = process.env.REST_BASE_URL;

export const fetch = async (path: string) => {
	const res = await got.get<any>(`${baseUrl}${path}`).json();
	return res as any;
};
