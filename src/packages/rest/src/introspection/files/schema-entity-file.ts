import { EntityInformation, FieldInformation } from '..';
import { baseUrlFromOperations, listPathFromOperations, pascalToKebabCaseString } from '../utils';
const padding = '\t';

export class SchemaEntityFile {
	protected readonly coreImports = new Set<string>();
	protected readonly scalarImports = new Set<string>();
	protected readonly entityImports = new Set<string>();

	constructor(
		protected readonly host: string,
		protected readonly meta: EntityInformation
	) {}

	getBasePath() {
		return `backend/schema/`;
	}

	getBaseName() {
		return `${pascalToKebabCaseString(this.meta.name)}.ts`;
	}

	generate(): string {
		let classBody = '';
		this.meta.fields.forEach((prop, index) => {
			const decorator = this.getPropertyDecorator(prop);
			const definition = this.getPropertyDefinition(prop);

			if (classBody && !classBody.endsWith('\n\n')) {
				classBody += '\n';
			}

			classBody += decorator;
			classBody += definition;

			if (index !== this.meta.fields.length - 1) classBody += '\n';
		});

		let file = '';

		this.coreImports.add('Entity');
		file += `@Entity<${this.meta.name}>('${this.meta.name}', {
    adminUIOptions: { readonly: true },
    apiOptions: { excludeFromBuiltInWriteOperations: true },
    provider: new RestBackendProvider({
        baseUrl: 'https://${this.host}${baseUrlFromOperations(this.meta.operations)}',
        defaultPath: '${listPathFromOperations(this.meta.operations)}',
        fieldConfig: {
            // Configure any transforms you need for fields here.
        },
    }),
})
`;
		file += `export class ${this.meta.name} {\n`;
		file += `${classBody}}\n`;
		const imports = [
			`import { ${[...this.coreImports].sort().join(', ')} } from '@exogee/graphweaver';`,
		];

		if (this.scalarImports.size > 0) {
			imports.push(
				`import { ${[...this.scalarImports]
					.sort()
					.join(', ')} } from '@exogee/graphweaver-scalars';`
			);
		}

		imports.push(`import { RestBackendProvider } from '@exogee/graphweaver-rest';`);

		const entityImports = [...this.entityImports].filter((e) => e !== this.meta.name);
		entityImports.sort().forEach((entity) => {
			imports.push(`import { ${entity} } from './${pascalToKebabCaseString(entity)}';`);
		});

		file = `${imports.join('\n')}\n\n${file}`;

		return file;
	}

	protected getPropertyDefinition(prop: FieldInformation): string {
		return `\t${prop.name}?: ${prop.type};\n`;
	}

	private getGraphQLPropertyType(prop: FieldInformation): string {
		if (prop.primary) {
			this.coreImports.add('ID');
			return 'ID';
		}

		if (prop.type === 'Date') {
			this.scalarImports.add('ISODateStringScalar');
			return 'ISODateStringScalar';
		}

		if (prop.type === 'number') return 'Number';
		if (prop.type === 'string') return 'String';
		if (prop.type === 'boolean') return 'Boolean';

		return prop.type;
	}

	private getPropertyDecorator(prop: FieldInformation): string {
		const options = {} as Record<string, any>;
		let decorator = this.getDecoratorType(prop);

		this.getCommonDecoratorOptions(options, prop);
		decorator = [decorator].map((d) => padding + d).join('\n');

		if (!Object.keys(options).length) {
			return `${decorator}(() => ${this.getGraphQLPropertyType(prop)})\n`;
		}

		return `${decorator}(() => ${this.getGraphQLPropertyType(prop)}, { ${Object.entries(options)
			.map(([opt, val]) => `${opt}: ${JSON.stringify(val).replaceAll('"', '')}`)
			.join(', ')} })\n`;
	}

	protected getCommonDecoratorOptions(options: Record<string, any>, prop: FieldInformation): void {
		options.nullable = true;

		if (prop.primary) {
			options.primaryKeyField = true;
		}

		// If there's a property called 'name' it should be the summary field. If not, and there's a field called 'title'
		// then it should be the summary field.
		if (prop.name === 'name') {
			options.adminUIOptions = { summaryField: true };
		} else if (prop.name === 'title' && !this.meta.fields.find((prop) => prop.name === 'name')) {
			options.adminUIOptions = { summaryField: true };
		}
	}

	// We know prop isn't used yet, but it very well will be soon.
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected getDecoratorType(prop: FieldInformation): string {
		this.coreImports.add('Field');
		return '@Field';
	}
}
