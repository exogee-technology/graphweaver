import { DatabaseType } from '../../database';

export class DataSourceIndexFile {
	constructor(protected readonly databaseType: DatabaseType) {}

	getBasePath() {
		return `backend/entities/`;
	}

	getBaseName() {
		return 'index.ts';
	}

	generate(): string {
		const imports = [`export * from './${this.databaseType}';`];

		return `${imports.join('\n')}\n`;
	}
}
