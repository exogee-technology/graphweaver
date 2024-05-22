import { EntityMetadata } from '@mikro-orm/core';

export class SchemaIndexFile {
	constructor(protected readonly metadata: EntityMetadata<any>[]) {}

	getBasePath() {
		return `backend/schema`;
	}

	getBaseName() {
		return 'index.ts';
	}

	generate(): string {
		return (
			this.metadata
				.filter((meta) => !meta.pivotTable)
				.map(
					(meta) =>
						`import './${meta.className.replace(/([a-z0–9])([A-Z])/g, '$1-$2').toLowerCase()}';`
				)
				.join('\n') + '\n'
		);
	}
}
