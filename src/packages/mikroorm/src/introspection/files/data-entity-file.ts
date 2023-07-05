// This file is a modified version of source from MikroORM, located here:
// https://github.com/mikro-orm/mikro-orm/blob/6ba3d4004deef00b754a4ca2011cf64e44a4a3a3/packages/entity-generator/src/SourceFile.ts
//
// MIT License
//
// Copyright (c) 2018 Martin Adámek
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import type {
	Dictionary,
	EntityMetadata,
	EntityOptions,
	EntityProperty,
	NamingStrategy,
	Platform,
} from '@mikro-orm/core';
import { ReferenceType, UnknownType, Utils } from '@mikro-orm/core';
import { BaseFile } from './base-file';
import { DatabaseType } from '../../database';

export class DataEntityFile extends BaseFile {
	protected readonly coreImports = new Set<string>();
	protected readonly entityImports = new Set<string>();

	constructor(
		protected readonly meta: EntityMetadata,
		protected readonly namingStrategy: NamingStrategy,
		protected readonly platform: Platform,
		protected readonly databaseType: DatabaseType
	) {
		super(meta, namingStrategy, platform);
	}

	getBasePath() {
		return `backend/entities/${this.databaseType}/`;
	}

	getBaseName() {
		const fileName = this.pascalToKebabCaseString(this.meta.className);
		return `${fileName}.ts`;
	}

	generate(): string {
		const enumDefinitions: string[] = [];
		let classBody = '';
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
				enumDefinitions.push(this.getEnumClassDefinition(enumClassName, prop.items as string[]));
			}
		});

		let ret = ``;

		this.coreImports.add('Entity');
		const imports = [
			`import { ${[...this.coreImports].sort().join(', ')} } from '@mikro-orm/core';`,
			`import { BaseEntity } from '@exogee/graphweaver-mikroorm';`,
		];
		const entityImports = [...this.entityImports].filter((e) => e !== this.meta.className);
		entityImports.sort().forEach((entity) => {
			imports.push(`import { ${entity} } from './${this.pascalToKebabCaseString(entity)}';`);
		});

		if (enumDefinitions.length) {
			ret += enumDefinitions.join('\n');
			ret += '\n';
		}

		ret += `@Entity(${this.getCollectionDecl()})\n`;
		ret += `export class ${this.meta.className} extends BaseEntity {`;

		ret += `${classBody}}\n`;

		ret = `${imports.join('\n')}\n\n${ret}`;

		return ret;
	}

	protected getPropertyType(prop: EntityProperty): string {
		if (['jsonb', 'json', 'any'].includes(prop.columnTypes?.[0])) {
			return `Record<string, unknown>`;
		}

		return prop.type;
	}

	protected getPropertyDefinition(prop: EntityProperty): string {
		const padding = '\t';

		if ([ReferenceType.ONE_TO_MANY, ReferenceType.MANY_TO_MANY].includes(prop.reference)) {
			this.coreImports.add('Collection');
			this.entityImports.add(prop.type);
			return `${padding}${prop.name} = new Collection<${prop.type}>(this);\n`;
		}

		// string defaults are usually things like SQL functions, but can be also enums, for that `useDefault` should be true
		const isEnumOrNonStringDefault = prop.enum || typeof prop.default !== 'string';
		const useDefault = prop.default != null && isEnumOrNonStringDefault;
		const optional = prop.nullable ? '?' : useDefault ? '' : '!';

		if (prop.wrappedReference) {
			this.coreImports.add('IdentifiedReference');
			this.entityImports.add(prop.type);
			return `${padding}${prop.name}${optional}: IdentifiedReference<${prop.type}>;\n`;
		}

		if (prop.primary) {
			return `${padding}id!: ${this.getPropertyType(prop)};`;
		}

		const ret = `${prop.name}${optional}: ${this.getPropertyType(prop)}`;

		if (!useDefault) {
			return `${padding + ret};\n`;
		}

		if (prop.enum && typeof prop.default === 'string') {
			return `${padding}${ret} = ${prop.type}.${prop.default.toUpperCase()};\n`;
		}

		return `${padding}${prop.name} = ${prop.default};\n`;
	}

	protected getEnumClassDefinition(enumClassName: string, enumValues: string[]): string {
		const padding = '\t';
		let ret = `export enum ${enumClassName} {\n`;

		for (const enumValue of enumValues) {
			ret += `${padding}${enumValue.toUpperCase()} = '${enumValue}',\n`;
		}

		ret += '}\n';

		return ret;
	}

	private getCollectionDecl() {
		const options: EntityOptions<unknown> = {};

		options.tableName = this.quote(this.meta.collection);

		if (this.meta.schema && this.meta.schema !== this.platform.getDefaultSchemaName()) {
			options.schema = this.quote(this.meta.schema);
		}

		if (!Utils.hasObjectKeys(options)) {
			return '';
		}

		return `{ ${Object.entries(options)
			.map(([opt, val]) => `${opt}: ${val}`)
			.join(', ')} }`;
	}

	private getPropertyDecorator(prop: EntityProperty): string {
		const padding = '\t';
		const options = {} as Dictionary;
		let decorator = this.getDecoratorType(prop);
		this.coreImports.add(decorator.substring(1));

		if (prop.reference === ReferenceType.MANY_TO_MANY) {
			this.getManyToManyDecoratorOptions(options, prop);
		} else if (prop.reference === ReferenceType.ONE_TO_MANY) {
			this.getOneToManyDecoratorOptions(options, prop);
		} else if (prop.reference !== ReferenceType.SCALAR) {
			this.getForeignKeyDecoratorOptions(options, prop);
		} else {
			this.getScalarPropertyDecoratorOptions(options, prop);
		}

		if (prop.enum) {
			options.items = `() => ${prop.type}`;
		}

		if (prop.primary && prop.name !== 'id' && prop.fieldNames?.[0]) {
			options.fieldName = this.quote(prop.fieldNames[0]);
		}

		this.getCommonDecoratorOptions(options, prop);
		const indexes = this.getPropertyIndexes(prop, options);
		decorator = [...indexes.sort(), decorator].map((d) => padding + d).join('\n');

		if (!Utils.hasObjectKeys(options)) {
			return `${decorator}()\n`;
		}

		return `${decorator}({ ${Object.entries(options)
			.map(([opt, val]) => `${opt}: ${val}`)
			.join(', ')} })\n`;
	}

	protected getPropertyIndexes(prop: EntityProperty, options: Dictionary): string[] {
		if (prop.reference === ReferenceType.SCALAR) {
			const ret: string[] = [];

			if (prop.index) {
				this.coreImports.add('Index');
				ret.push(`@Index({ name: '${prop.index}' })`);
			}

			if (prop.unique) {
				this.coreImports.add('Unique');
				ret.push(`@Unique({ name: '${prop.unique}' })`);
			}

			return ret;
		}

		const processIndex = (type: 'index' | 'unique') => {
			if (!prop[type]) {
				return;
			}

			const defaultName = this.platform.getIndexName(this.meta.collection, prop.fieldNames, type);
			options[type] = defaultName === prop[type] ? 'true' : `'${prop[type]}'`;
			const expected = {
				index: this.platform.indexForeignKeys(),
				unique: prop.reference === ReferenceType.ONE_TO_ONE,
			};

			if (expected[type] && options[type] === 'true') {
				delete options[type];
			}
		};

		processIndex('index');
		processIndex('unique');

		return [];
	}

	protected getCommonDecoratorOptions(options: Dictionary, prop: EntityProperty): void {
		if (prop.nullable && !prop.mappedBy) {
			options.nullable = true;
		}

		if (prop.default == null) {
			return;
		}

		if (typeof prop.default !== 'string') {
			options.default = prop.default;
			return;
		}

		if ([`''`, ''].includes(prop.default)) {
			options.default = `''`;
		} else if (prop.defaultRaw === this.quote(prop.default)) {
			options.default = this.quote(prop.default);
		} else {
			options.defaultRaw = `\`${prop.default}\``;
		}
	}

	protected getScalarPropertyDecoratorOptions(options: Dictionary, prop: EntityProperty): void {
		let t = prop.type.toLowerCase();

		if (t === 'date') {
			t = 'datetime';
		}

		if (prop.fieldNames[0] !== this.namingStrategy.propertyToColumnName(prop.name)) {
			options.fieldName = `'${prop.fieldNames[0]}'`;
		}

		// for enum properties, we don't need a column type or the property length
		// in the decorator so return early.
		if (prop.enum) {
			options.type = this.quote('string');
			return;
		}

		const mappedType1 = this.platform.getMappedType(t);
		const mappedType2 = this.platform.getMappedType(prop.columnTypes[0]);
		const columnType1 = mappedType1.getColumnType({ ...prop, autoincrement: false }, this.platform);
		const columnType2 = mappedType2.getColumnType({ ...prop, autoincrement: false }, this.platform);

		if (
			columnType1 !== columnType2 ||
			[mappedType1, mappedType2].some((t) => t instanceof UnknownType)
		) {
			options.type = this.quote(prop.columnTypes[0]);
		} else {
			options.type = this.quote(prop.type);
		}

		if (prop.length) {
			options.length = prop.length;
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
		this.entityImports.add(prop.type);
		options.entity = `() => ${prop.type}`;

		if (prop.wrappedReference) {
			options.wrappedReference = true;
		}

		if (prop.mappedBy) {
			options.mappedBy = this.quote(prop.mappedBy);
			return;
		}

		if (
			prop.fieldNames[0] !==
			this.namingStrategy.joinKeyColumnName(prop.name, prop.referencedColumnNames[0])
		) {
			options.fieldName = this.quote(prop.fieldNames[0]);
		}

		if (prop.primary) {
			options.primary = true;
		}
	}

	protected getDecoratorType(prop: EntityProperty): string {
		if (prop.reference === ReferenceType.ONE_TO_ONE) {
			return '@OneToOne';
		}

		if (prop.reference === ReferenceType.MANY_TO_ONE) {
			return '@ManyToOne';
		}

		if (prop.reference === ReferenceType.ONE_TO_MANY) {
			return '@OneToMany';
		}

		if (prop.reference === ReferenceType.MANY_TO_MANY) {
			return '@ManyToMany';
		}

		if (prop.primary) {
			return '@PrimaryKey';
		}

		if (prop.enum) {
			return '@Enum';
		}

		return '@Property';
	}
}
