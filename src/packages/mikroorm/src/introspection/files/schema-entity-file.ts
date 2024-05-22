import type {
	Dictionary,
	EntityMetadata,
	EntityProperty,
	NamingStrategy,
	Platform,
} from '@mikro-orm/core';
import { ReferenceKind, Utils } from '@mikro-orm/core';

import { BaseFile } from './base-file';
import { pascalToCamelCaseString, pascalToKebabCaseString } from '../utils';
import pluralize from 'pluralize';

export class SchemaEntityFile extends BaseFile {
	protected readonly coreImports = new Set<string>();
	protected readonly scalarImports = new Set<string>();
	protected readonly entityImports = new Set<string>();
	protected readonly enumImports = new Set<string>();

	constructor(
		protected readonly meta: EntityMetadata,
		protected readonly namingStrategy: NamingStrategy,
		protected readonly platform: Platform
	) {
		super(meta, namingStrategy, platform);
	}

	getBasePath() {
		return `backend/schema/`;
	}

	getBaseName() {
		const fileName = pascalToKebabCaseString(this.meta.className);
		return `${fileName}.ts`;
	}

	generate(): string {
		const enumDefinitions: string[] = [];
		let classBody = '\n';
		const props = Object.values(this.meta.properties);
		props.forEach((prop) => {
			const decorator = this.getPropertyDecorator(prop);
			const definition = this.getPropertyDefinition(prop);

			if (!classBody.endsWith('\n\n')) {
				classBody += '\n';
			}

			classBody += decorator;
			classBody += definition;

			if (props[props.length - 1] !== prop) classBody += '\n';

			if (prop.enum) {
				const enumClassName = this.namingStrategy.getClassName(
					this.meta.collection + '_' + prop.fieldNames[0],
					'_'
				);
				enumDefinitions.push(this.getEnumClassDefinition(enumClassName));
			}
		});

		let file = '';

		if (enumDefinitions.length) {
			file += enumDefinitions.join('\n');
			file += '\n\n';
		}

		this.coreImports.add('Entity');
		file += `@Entity<${this.meta.className}>(${this.quote(this.meta.className)}, {\n\tprovider: new MikroBackendProvider(Orm${this.meta.className}, connection),\n})\n`;

		this.coreImports.add('GraphQLEntity');
		file += `export class ${this.meta.className} extends GraphQLEntity<Orm${this.meta.className}> {\n`;
		file += `\tpublic dataEntity!: Orm${this.meta.className};`;

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

		imports.push(`import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';`);

		const entityImports = [...this.entityImports].filter((e) => e !== this.meta.className);
		entityImports.sort().forEach((entity) => {
			imports.push(`import { ${entity} } from './${pascalToKebabCaseString(entity)}';`);
		});

		imports.push(
			`import { ${this.enumImports.size > 0 ? [...this.enumImports].sort().join(', ') + ', ' : ''}${
				this.meta.className
			} as Orm${this.meta.className} } from '../entities';`,
			`import { connection } from '../database';`
		);

		file = `${imports.join('\n')}\n\n${file}`;

		return file;
	}

	protected getTypescriptPropertyType(prop: EntityProperty): string {
		if (['jsonb', 'json', 'any'].includes(prop.columnTypes?.[0])) {
			return `Record<string, unknown>`;
		}

		if (prop.columnTypes?.[0] === 'date') {
			return 'Date';
		}

		if (prop.type === 'unknown') {
			//fallback to string if unknown
			return 'string';
		}

		return prop.type;
	}

	protected getPropertyDefinition(prop: EntityProperty): string {
		const padding = '\t';

		if ([ReferenceKind.ONE_TO_MANY, ReferenceKind.MANY_TO_MANY].includes(prop.kind)) {
			this.entityImports.add(prop.type);
			return `${padding}${prop.name}!: ${prop.type}[];\n`;
		}

		// string defaults are usually things like SQL functions, but can be also enums, for that `useDefault` should be true
		const isEnumOrNonStringDefault = prop.enum || typeof prop.default !== 'string';
		const useDefault = prop.default != null && isEnumOrNonStringDefault;
		const optional = prop.nullable ? '?' : useDefault ? '' : '!';

		const file = `${prop.name}${optional}: ${this.getTypescriptPropertyType(prop)}`;

		if (!useDefault) {
			return `${padding + file};\n`;
		}

		if (prop.enum && typeof prop.default === 'string') {
			return `${padding}${file} = ${prop.type}.${prop.default.toUpperCase()};\n`;
		}

		return `${padding}${prop.name} = ${prop.default};\n`;
	}

	protected getEnumClassDefinition(enumClassName: string): string {
		this.coreImports.add('registerEnumType');
		this.enumImports.add(enumClassName);
		return `registerEnumType(${enumClassName}, { name: ${this.quote(enumClassName)} });`;
	}

	private getGraphQLPropertyType(prop: EntityProperty): string {
		if (prop.primary) {
			this.coreImports.add('ID');
			return 'ID';
		}

		if (prop.type === 'Date') {
			this.scalarImports.add('ISODateStringScalar');
			return 'ISODateStringScalar';
		}

		if (prop.columnTypes?.[0] === 'date') {
			return 'Date';
		}

		if (prop.type === 'unknown') {
			return 'String';
		}

		if (['jsonb', 'json', 'any'].includes(prop.columnTypes?.[0])) {
			this.scalarImports.add('GraphQLJSON');
			return `GraphQLJSON`;
		}

		if (prop.type.includes('[]')) {
			return `[${prop.type.charAt(0).toUpperCase() + prop.type.slice(1).replace('[]', '')}]`;
		}

		if ([ReferenceKind.MANY_TO_MANY, ReferenceKind.ONE_TO_MANY].includes(prop.kind)) {
			return `[${prop.type.charAt(0).toUpperCase() + prop.type.slice(1).replace('[]', '')}]`;
		}

		if (prop.pivotTable) {
			return `[${prop.type.charAt(0).toUpperCase() + prop.type.slice(1)}]`;
		}

		return prop.type.charAt(0).toUpperCase() + prop.type.slice(1);
	}

	private getPropertyDecorator(prop: EntityProperty): string {
		const padding = '\t';
		const options = {} as Dictionary;
		let decorator = this.getDecoratorType(prop);

		if (prop.kind === ReferenceKind.MANY_TO_MANY) {
			this.getManyToManyDecoratorOptions(options, prop);
		} else if (prop.kind === ReferenceKind.ONE_TO_MANY) {
			this.getOneToManyDecoratorOptions(options, prop);
		} else if (prop.kind !== ReferenceKind.SCALAR) {
			this.getForeignKeyDecoratorOptions(options, prop);
		}

		this.getCommonDecoratorOptions(options, prop);
		decorator = [decorator].map((d) => padding + d).join('\n');

		if (!Utils.hasObjectKeys(options)) {
			return `${decorator}(() => ${this.getGraphQLPropertyType(prop)})\n`;
		}

		return `${decorator}(() => ${this.getGraphQLPropertyType(prop)}, { ${Object.entries(options)
			.map(([opt, val]) => `${opt}: ${JSON.stringify(val).replaceAll('"', '')}`)
			.join(', ')} })\n`;
	}

	protected getCommonDecoratorOptions(options: Dictionary, prop: EntityProperty): void {
		if (prop.nullable && !prop.mappedBy) {
			options.nullable = true;
		}

		if (prop.primary) {
			options.primaryKeyField = true;
		}
	}

	protected getManyToManyDecoratorOptions(options: Dictionary, prop: EntityProperty) {
		this.entityImports.add(prop.type);
		options.relatedField = this.quote(pluralize(pascalToCamelCaseString(this.meta.className)));
	}

	protected getOneToManyDecoratorOptions(options: Dictionary, prop: EntityProperty) {
		this.entityImports.add(prop.type);
		options.relatedField = this.quote(prop.mappedBy);
	}

	protected getForeignKeyDecoratorOptions(options: Dictionary, prop: EntityProperty) {
		this.entityImports.add(prop.type);

		// Note: You'd think you want to look up the primary key field name for the related entity,
		// but the Ref type from MikroORM actually just hardcodes `id` here, so we need to do that as well.
		options.id = `(entity) => entity.${prop.name}?.id`;
	}

	protected getDecoratorType(prop: EntityProperty): string {
		if ([ReferenceKind.ONE_TO_ONE, ReferenceKind.MANY_TO_ONE].includes(prop.kind)) {
			this.coreImports.add('RelationshipField');
			return `@RelationshipField<${this.meta.className}>`;
		}

		if ([ReferenceKind.ONE_TO_MANY, ReferenceKind.MANY_TO_MANY].includes(prop.kind)) {
			this.coreImports.add('RelationshipField');
			return `@RelationshipField<${prop.type}>`;
		}

		this.coreImports.add('Field');
		return '@Field';
	}
}
