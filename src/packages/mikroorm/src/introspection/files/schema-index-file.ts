import { BaseFile } from './base-file';

export class SchemaIndexFile extends BaseFile {
	getBasePath() {
		const dirName = this.pascalToKebabCaseString(this.meta.className);
		return `backend/schema/${dirName}/`;
	}

	getBaseName() {
		return 'index.ts';
	}

	generate(): string {
		const imports = [`export * from './entity';`, `export * from './resolver';`];

		return `${imports.join('\n')}`;
	}
}
