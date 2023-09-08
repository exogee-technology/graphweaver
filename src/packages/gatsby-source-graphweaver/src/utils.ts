import fetch from 'node-fetch';

export async function fetchGraphQL<T>(endpoint: string, apiKey: string, query: string): Promise<T> {
	console.info(`Fetching GraphQL data from ${endpoint}`);

	let attempt = 0;

	const headers = {
		'Content-Type': `application/json`,
		Authorization: `Bearer ${apiKey}`,
	};

	while (attempt < 3) {
		try {
			const response = await fetch(endpoint, {
				method: `POST`,
				headers,
				body: JSON.stringify({
					query,
				}),
			});
			return (await response.json()) as T;
		} catch (error) {
			console.info(
				`Error ${attempt + 1}: ${error instanceof Error ? error.message : String(error)}`
			);
			attempt++;
			console.info('waiting 5s to try again');
			await new Promise((resolve) => setTimeout(resolve, 5000));
		}
	}

	throw new Error(`Gave up after ${attempt + 1} attempts`);
}
