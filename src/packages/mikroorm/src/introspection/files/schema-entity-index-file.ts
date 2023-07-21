import { pascalToKebabCaseString } from '../utils';
import { BaseFile } from './base-file';

export class SchemaEntityIndexFile extends BaseFile {
	getBasePath() {
		const dirName = pascalToKebabCaseString(this.meta.className);
		return `backend/schema/${dirName}/`;
	}

	getBaseName() {
		return 'index.ts';
	}

	generate(): string {
		const exports = [`export * from './entity';`, `export * from './resolver';`];

		return `${exports.join('\n')}\n`;
	}
}
