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
import { ReferenceKind, UnknownType, Utils } from '@mikro-orm/core';
import { BaseFile } from './base-file';
import { DatabaseType } from '../../database';
import { identifierForEnumValue, pascalToKebabCaseString } from '../utils';

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
		const fileName = pascalToKebabCaseString(this.meta.className);
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

		let file = ``;

		this.coreImports.add('Entity');
		const imports = [
			`import { ${[...this.coreImports].sort().join(', ')} } from '@mikro-orm/core';`,
		];
		const entityImports = [...this.entityImports].filter((e) => e !== this.meta.className);
		entityImports.sort().forEach((entity) => {
			imports.push(`import { ${entity} } from './${pascalToKebabCaseString(entity)}';`);
		});

		if (enumDefinitions.length) {
			file += enumDefinitions.join('\n');
			file += '\n';
		}

		file += `@Entity(${this.getCollectionDecl()})\n`;
		file += `export class ${this.meta.className} {`;

		file += `${classBody}}\n`;

		file = `${imports.join('\n')}\n\n${file}`;

		return file;
	}

	protected getPropertyType(prop: EntityProperty): string {
		if ([ReferenceKind.ONE_TO_ONE, ReferenceKind.MANY_TO_ONE].includes(prop.kind)) {
			return prop.type.charAt(0).toUpperCase() + prop.type.slice(1);
		}

		const columnType = prop.columnTypes?.[0]?.toLowerCase();

		if (['jsonb', 'json', 'any'].includes(columnType)) {
			return `Record<string, unknown>`;
		}

		// Mikro doesn't infer column types for some columns very well. We can augment.
		if (prop.type === 'unknown') {
			if (columnType?.startsWith('nvarchar(') || columnType?.startsWith('varchar(')) {
				return 'string';
			}
		}

		return prop.runtimeType;
	}

	protected getPropertyDefinition(prop: EntityProperty): string {
		const padding = '\t';

		if ([ReferenceKind.ONE_TO_MANY, ReferenceKind.MANY_TO_MANY].includes(prop.kind)) {
			this.coreImports.add('Collection');
			this.entityImports.add(prop.type);
			return `${padding}${prop.name} = new Collection<${prop.type}>(this);\n`;
		}

		// string defaults are usually things like SQL functions, but can be also enums, for that `useDefault` should be true
		const isEnumOrNonStringDefault = prop.enum || typeof prop.default !== 'string';
		const useDefault = prop.default != null && isEnumOrNonStringDefault;
		const optional = prop.nullable ? '?' : useDefault ? '' : '!';

		if (prop.ref) {
			this.coreImports.add('Ref');
			this.entityImports.add(prop.type);
			return `${padding}${prop.name}${optional}: Ref<${prop.type}>;\n`;
		}

		const file = `${prop.name}${optional}: ${this.getPropertyType(prop)}`;

		if (!useDefault) {
			return `${padding + file};\n`;
		}

		if (prop.enum && typeof prop.default === 'string') {
			return `${padding}${file} = ${prop.runtimeType}.${identifierForEnumValue(prop.default)};\n`;
		}

		return `${padding}${prop.name} = ${prop.default};\n`;
	}

	protected getEnumClassDefinition(enumClassName: string, enumValues: string[]): string {
		const padding = '\t';
		let file = `export enum ${enumClassName} {\n`;

		for (const enumValue of enumValues) {
			file += `${padding}${identifierForEnumValue(enumValue)} = '${enumValue}',\n`;
		}

		file += '}\n';

		return file;
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

		if (prop.kind === ReferenceKind.MANY_TO_MANY) {
			this.getManyToManyDecoratorOptions(options, prop);
		} else if (prop.kind === ReferenceKind.ONE_TO_MANY) {
			this.getOneToManyDecoratorOptions(options, prop);
		} else if (prop.kind !== ReferenceKind.SCALAR) {
			this.getForeignKeyDecoratorOptions(options, prop);
		} else {
			this.getScalarPropertyDecoratorOptions(options, prop);
		}

		if (prop.enum) {
			options.items = `() => ${prop.runtimeType}`;
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
		if (prop.kind === ReferenceKind.SCALAR) {
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
				unique: prop.kind === ReferenceKind.ONE_TO_ONE,
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

		if (prop.ref) {
			options.ref = true;
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
		if (prop.kind === ReferenceKind.ONE_TO_ONE) {
			return '@OneToOne';
		}

		if (prop.kind === ReferenceKind.MANY_TO_ONE) {
			return '@ManyToOne';
		}

		if (prop.kind === ReferenceKind.ONE_TO_MANY) {
			return '@OneToMany';
		}

		if (prop.kind === ReferenceKind.MANY_TO_MANY) {
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
