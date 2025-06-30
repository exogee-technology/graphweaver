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

// Anything that is not alphanumeric or an underscore is replaced with an underscore, then the value is uppercased
export const identifierForEnumValue = (value: string) => {
	const identifier = value.replace(/[^a-z0-9_]/gi, '_').toUpperCase();

	// Enums have to have string identifiers.
	if (/^\d+$/.test(identifier)) {
		return `_${identifier}`;
	} else {
		return identifier;
	}
};
