export const pascalToKebabCaseString = (value: string) => {
	return value.replace(/([a-z0–9])([A-Z])/g, '$1-$2').toLowerCase();
};

export const snakeToCamelCaseString = (value: string) => {
	return value.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

export const pascalToCamelCaseString = (value: string) => {
	const firstChar = value.charAt(0).toLowerCase();
	const restOfString = value.slice(1);
	return firstChar + restOfString;
};
