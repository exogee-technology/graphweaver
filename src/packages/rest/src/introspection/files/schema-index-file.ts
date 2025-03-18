import { EntityInformation } from '..';

export class SchemaIndexFile {
	constructor(protected readonly entities: EntityInformation[]) {}

	getBasePath() {
		return `backend/schema`;
	}

	getBaseName() {
		return 'index.ts';
	}

	generate(): string {
		return (
			this.entities
				.map(
					(entity) =>
						`import './${entity.name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}';`
				)
				.sort()
				.join('\n') + '\n'
		);
	}
}
