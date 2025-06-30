import { EntityMetadata } from '@mikro-orm/core';
import { DatabaseType } from '../../database';
import { isEntityWithSinglePrimaryKey } from '../generate';
import { pascalToKebabCaseString } from '../utils';

export class DataEntityIndexFile {
	constructor(
		protected readonly metadata: EntityMetadata<any>[],
		protected readonly databaseType: DatabaseType
	) {}

	getBasePath() {
		return `backend/entities/${this.databaseType}/`;
	}

	getBaseName() {
		return 'index.ts';
	}

	generate(): string {
		let file = 'export const entities = [\n';
		const padding = '\t';
		const imports: string[] = [];
		const exports: string[] = [];

		for (const meta of this.metadata) {
			if (!meta.pivotTable && isEntityWithSinglePrimaryKey(meta)) {
				const filename = pascalToKebabCaseString(meta.className);
				exports.push(`export * from './${filename}';`);
				imports.push(`import { ${meta.className} } from './${filename}';`);
				file += `${padding}${meta.className},\n`;
			}
		}

		file += '];\n';

		return `${imports.join('\n')}\n\n${exports.join('\n')}\n\n${file}`;
	}
}
