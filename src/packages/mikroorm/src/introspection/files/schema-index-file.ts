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
		let file = 'export const resolvers = [\n';
		const padding = '\t';
		const imports: string[] = [];
		const exports: string[] = [];

		for (const meta of this.metadata) {
			if (!meta.pivotTable) {
				const filename = meta.className.replace(/([a-z0–9])([A-Z])/g, '$1-$2').toLowerCase();
				exports.push(`export * from './${filename}';`);
				imports.push(`import { ${meta.className}Resolver } from './${filename}';`);
				file += `${padding}${meta.className}Resolver,\n`;
			}
		}

		file += '];\n';

		return `${imports.join('\n')}\n\n${exports.join('\n')}\n\n${file}`;
	}
}
