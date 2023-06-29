import { EntityMetadata, NamingStrategy, Platform } from '@mikro-orm/core';

export class BaseFile {
	constructor(
		protected readonly meta: EntityMetadata,
		protected readonly namingStrategy: NamingStrategy,
		protected readonly platform: Platform
	) {}

	protected quote(val: string) {
		return val.startsWith(`'`) ? `\`${val}\`` : `'${val}'`;
	}

	pascalToKebabCaseString(value: string) {
		return value.replace(/([a-z0–9])([A-Z])/g, '$1-$2').toLowerCase();
	}

	snakeToCamelCaseString(value: string) {
		return value.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
	}
}
