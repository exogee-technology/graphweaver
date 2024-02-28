import pluralize from 'pluralize';

export const pluralise = (str: string): string => {
	const plural = pluralize.plural(str);
	return plural === str ? `multiple${str[0].toUpperCase()}${str.slice(1)}` : plural;
};
