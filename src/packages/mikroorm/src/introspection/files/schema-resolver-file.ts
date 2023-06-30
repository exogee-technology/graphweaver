import { BaseFile } from './base-file';

export class SchemaResolverFile extends BaseFile {
	getBasePath() {
		const dirName = this.pascalToKebabCaseString(this.meta.className);
		return `backend/schema/${dirName}/`;
	}

	getBaseName() {
		return 'resolver.ts';
	}

	generate(): string {
		const padding = '\t';

		let ret = `@Resolver((of) => ${this.meta.className})\n`;
		ret += `export class ${this.meta.className}Resolver extends createBaseResolver<${this.meta.className}, Orm${this.meta.className}>(\n`;
		ret += `${padding}${this.meta.className},\n`;
		ret += `${padding}new MikroBackendProvider(Orm${this.meta.className}, connection)\n`;
		ret += `) {}\n`;

		const imports = [
			`import { createBaseResolver, Resolver } from '@exogee/graphweaver';`,
			`import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';`,
			`import { ${this.meta.className} } from './entity';`,
			`import { ${this.meta.className} as Orm${this.meta.className} } from '../../entities';`,
			`import { connection } from '../../database';`,
		];

		return `${imports.join('\n')}\n\n${ret}`;
	}
}
