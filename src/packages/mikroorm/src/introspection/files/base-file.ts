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
}
