import { FieldTransformer } from '@exogee/graphweaver-rest';

const extractIdFromUrl = (url: unknown) => {
	if (typeof url !== 'string') return url;

	// A typical URL looks like this: https://swapi.info/api/people/1/
	// pathname in this case would be '/api/people/1/';
	// When we split, we get ['', 'api', 'people', '1', ''], hence we need to get the 4th element.
	return new URL(url).pathname.split('/')[3];
};

// All references to objects in SWAPI are URLs, so we need to extract the ID from them.
export const urlToIdTransform: FieldTransformer = {
	fromApi: (value: unknown) => {
		if (Array.isArray(value)) return value.map(extractIdFromUrl);
		return extractIdFromUrl(value);
	},

	// Since the whole API is read only, this will never get used in this example. If our API allowed
	// write operations, we'd need to implement the inverse transform here and return a well-formed URL.
	toApi: (id: string) => id,
};
