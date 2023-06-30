import type {
	Dictionary,
	EntityMetadata,
	EntityProperty,
	NamingStrategy,
	Platform,
} from '@mikro-orm/core';
import { ReferenceType, Utils } from '@mikro-orm/core';

import { BaseFile } from './base-file';

export class SchemaEntityFile extends BaseFile {
	protected readonly coreImports = new Set<string>();
	protected readonly scalarImports = new Set<string>();
	protected readonly entityImports = new Set<string>();

	constructor(
		protected readonly meta: EntityMetadata,
		protected readonly namingStrategy: NamingStrategy,
		protected readonly platform: Platform
	) {
		super(meta, namingStrategy, platform);
	}

	getBasePath() {
		const dirName = this.pascalToKebabCaseString(this.meta.className);
		return `backend/schema/${dirName}/`;
	}

	getBaseName() {
		return 'entity.ts';
	}

	generate(): string {
		this.coreImports.add('ObjectType');
		let ret = `@ObjectType(${this.quote(this.meta.className)})\n`;

		this.coreImports.add('GraphQLEntity');
		ret += `export class ${this.meta.className} extends GraphQLEntity<Orm${this.meta.className}> {\n`;
		ret += `  public dataEntity!: Orm${this.meta.className};`;

		const enumDefinitions: string[] = [];
		let classBody = '\n';
		Object.values(this.meta.properties).forEach((prop) => {
			const decorator = this.getPropertyDecorator(prop, 2);
			const definition = this.getPropertyDefinition(prop, 2);

			if (!classBody.endsWith('\n\n')) {
				classBody += '\n';
			}

			classBody += decorator;
			classBody += definition;
			classBody += '\n';

			if (prop.enum) {
				const enumClassName = this.namingStrategy.getClassName(
					this.meta.collection + '_' + prop.fieldNames[0],
					'_'
				);
				enumDefinitions.push(this.getEnumClassDefinition(enumClassName, prop.items as string[], 2));
			}
		});

		ret += `${classBody}}\n`;
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

		const entityImports = [...this.entityImports].filter((e) => e !== this.meta.className);
		entityImports.sort().forEach((entity) => {
			imports.push(`import { ${entity} } from '../${this.pascalToKebabCaseString(entity)}';`);
		});

		imports.push(
			`import { ${this.meta.className} as Orm${this.meta.className} } from '../../entities';`
		);

		ret = `${imports.join('\n')}\n\n${ret}`;
		if (enumDefinitions.length) {
			ret += '\n' + enumDefinitions.join('\n');
		}

		return ret;
	}

	protected getPropertyDefinition(prop: EntityProperty, padLeft: number): string {
		const padding = ' '.repeat(padLeft);

		if ([ReferenceType.ONE_TO_MANY, ReferenceType.MANY_TO_MANY].includes(prop.reference)) {
			this.coreImports.add('Collection');
			this.entityImports.add(prop.type);
			return `${padding}${prop.name} = new Collection<${prop.type}>(this);\n`;
		}

		// string defaults are usually things like SQL functions, but can be also enums, for that `useDefault` should be true
		const isEnumOrNonStringDefault = prop.enum || typeof prop.default !== 'string';
		const useDefault = prop.default != null && isEnumOrNonStringDefault;
		const optional = prop.nullable ? '?' : useDefault ? '' : '!';

		const ret = `${prop.name}${optional}: ${prop.type}`;

		if (!useDefault) {
			return `${padding + ret};\n`;
		}

		if (prop.enum && typeof prop.default === 'string') {
			return `${padding}${ret} = ${prop.type}.${prop.default.toUpperCase()};\n`;
		}

		return `${padding}${ret} = ${prop.default};\n`;
	}

	protected getEnumClassDefinition(
		enumClassName: string,
		enumValues: string[],
		padLeft: number
	): string {
		const padding = ' '.repeat(padLeft);
		let ret = `export enum ${enumClassName} {\n`;

		for (const enumValue of enumValues) {
			ret += `${padding}${enumValue.toUpperCase()} = '${enumValue}',\n`;
		}

		ret += '}\n';

		return ret;
	}

	private getPropertyType(prop: EntityProperty): string {
		if (prop.primary) {
			this.coreImports.add('ID');
			return 'ID';
		}

		if (prop.type === 'Date') {
			this.scalarImports.add('ISOStringScalar');
			return 'ISOStringScalar';
		}

		if (prop.columnTypes?.[0] === 'date') {
			this.scalarImports.add('DateScalar');
			return 'DateScalar';
		}

		return prop.type.charAt(0).toUpperCase() + prop.type.slice(1);
	}

	private getPropertyDecorator(prop: EntityProperty, padLeft: number): string {
		const padding = ' '.repeat(padLeft);
		const options = {} as Dictionary;
		let decorator = this.getDecoratorType(prop);

		if ([ReferenceType.MANY_TO_MANY, ReferenceType.ONE_TO_MANY].includes(prop.reference)) {
			this.getManyToManyDecoratorOptions(options, prop);
		} else if (prop.reference === ReferenceType.ONE_TO_MANY) {
			this.getOneToManyDecoratorOptions(options, prop);
		} else if (prop.reference !== ReferenceType.SCALAR) {
			this.getForeignKeyDecoratorOptions(options, prop);
		}

		this.getCommonDecoratorOptions(options, prop);
		decorator = [decorator].map((d) => padding + d).join('\n');

		if (!Utils.hasObjectKeys(options)) {
			return `${decorator}(() => ${this.getPropertyType(prop)})\n`;
		}

		return `${decorator}(() => ${this.getPropertyType(prop)}, { ${Object.entries(options)
			.map(([opt, val]) => `${opt}: ${val}`)
			.join(', ')} })\n`;
	}

	protected getCommonDecoratorOptions(options: Dictionary, prop: EntityProperty): void {
		if (prop.nullable && !prop.mappedBy) {
			options.nullable = true;
		}
	}

	protected getManyToManyDecoratorOptions(options: Dictionary, prop: EntityProperty) {
		this.entityImports.add(prop.type);
		options.entity = `() => ${prop.type}`;

		if (prop.mappedBy) {
			options.mappedBy = this.quote(prop.mappedBy);
			return;
		}

		if (
			prop.pivotTable !==
			this.namingStrategy.joinTableName(this.meta.collection, prop.type, prop.name)
		) {
			options.pivotTable = this.quote(prop.pivotTable);
		}

		if (prop.joinColumns.length === 1) {
			options.joinColumn = this.quote(prop.joinColumns[0]);
		} else {
			options.joinColumns = `[${prop.joinColumns.map(this.quote).join(', ')}]`;
		}

		if (prop.inverseJoinColumns.length === 1) {
			options.inverseJoinColumn = this.quote(prop.inverseJoinColumns[0]);
		} else {
			options.inverseJoinColumns = `[${prop.inverseJoinColumns.map(this.quote).join(', ')}]`;
		}
	}

	protected getOneToManyDecoratorOptions(options: Dictionary, prop: EntityProperty) {
		this.entityImports.add(prop.type);
		options.entity = `() => ${prop.type}`;
		options.mappedBy = this.quote(prop.mappedBy);
	}

	protected getForeignKeyDecoratorOptions(options: Dictionary, prop: EntityProperty) {
		const parts = prop.referencedTableName.split('.', 2);
		const className = this.namingStrategy.getClassName(parts.length > 1 ? parts[1] : parts[0], '_');
		this.entityImports.add(className);
		options.id = this.quote(this.snakeToCamelCaseString(prop.fieldNames[0]));
	}

	protected getDecoratorType(prop: EntityProperty): string {
		if ([ReferenceType.ONE_TO_ONE, ReferenceType.MANY_TO_ONE].includes(prop.reference)) {
			this.coreImports.add('RelationshipField');
			return `@RelationshipField<${this.meta.className}>`;
		}

		if ([ReferenceType.ONE_TO_MANY, ReferenceType.MANY_TO_MANY].includes(prop.reference)) {
			this.coreImports.add('RelationshipField');
			return `@RelationshipField<${prop.type}>`;
		}

		this.coreImports.add('Field');
		return '@Field';
	}
}
