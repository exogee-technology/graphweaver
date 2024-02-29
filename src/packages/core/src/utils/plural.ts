import pluralize from 'pluralize';

const formatString = (str: string): string => `${str.charAt(0).toUpperCase()}${str.substring(1)}`;

export const pluralise = (str: string, userOverride: boolean): string => {
	if (userOverride) {
		return formatString(str);
	}
	const plural = pluralize.plural(str);
	return plural === str ? `Multiple${formatString(str)}` : plural;
};
