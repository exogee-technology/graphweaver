import { EntityMetadata } from '@mikro-orm/core';
import { isEntityWithSinglePrimaryKey } from '../generate';

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
				.filter((meta) => !meta.pivotTable && isEntityWithSinglePrimaryKey(meta))
				.map(
					(meta) =>
						`import './${meta.className.replace(/([a-z0–9])([A-Z])/g, '$1-$2').toLowerCase()}';`
				)
				.join('\n') + '\n'
		);
	}
}
