import { EntityMetadata } from '@mikro-orm/core';
import { DatabaseType } from '../../database';

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
		let ret = 'export const entities = [\n';
		const padding = '\t';
		const imports: string[] = [];
		const exports: string[] = [];

		for (const meta of this.metadata) {
			if (!meta.pivotTable) {
				const filename = meta.className.replace(/([a-z0–9])([A-Z])/g, '$1-$2').toLowerCase();
				exports.push(`export * from './${filename}';`);
				imports.push(`import { ${meta.className} } from './${filename}';`);
				ret += `${padding}${meta.className},\n`;
			}
		}

		ret += '];\n';

		return `${imports.join('\n')}\n\n${exports.join('\n')}\n\n${ret}`;
	}
}
