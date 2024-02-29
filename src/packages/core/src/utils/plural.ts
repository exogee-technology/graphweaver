import pluralize from 'pluralize';

const formatString = (str: string): string =>
	`${str[0].toUpperCase()}${str.slice(1).toLowerCase()}`;

export const pluralise = (str: string, userOverride: boolean): string => {
	if (userOverride) {
		return formatString(str);
	}
	const plural = pluralize.plural(str);
	return plural === str ? `Multiple${formatString(str)}` : plural;
};
