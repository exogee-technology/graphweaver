export class DataSourceIndexFile {
	getBasePath() {
		return `backend/entities/`;
	}

	getBaseName() {
		return 'index.ts';
	}

	generate(): string {
		const imports = [`export * from './postgresql';`];

		return `${imports.join('\n')}\n`;
	}
}
