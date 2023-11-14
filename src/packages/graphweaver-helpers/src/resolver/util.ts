export const caps = (value: string): string => `${value.charAt(0).toUpperCase()}${value.slice(1)}`;

export const setNameOnResolver = (resolver: any, name: string) =>
	Object.defineProperty(resolver, 'name', { value: name });
