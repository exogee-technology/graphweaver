import type { EntityModel, PropertyModel, RelationshipModel } from '../introspection/entity-model';
import { graphQLTypeFor } from './graphql-types';

const CORE = '@exogee/graphweaver';
const SQL = '@exogee/graphweaver-sql';

/** Turns `AppUser` into `app-user`, which is the file naming the existing generator uses. */
export const kebabCase = (value: string) =>
	value
		.replace(/([a-z\d])([A-Z])/g, '$1-$2')
		.replace(/[^A-Za-z0-9]+/g, '-')
		.toLowerCase();

class Imports {
	#byModule = new Map<string, Set<string>>();

	add(module: string, ...names: string[]) {
		const existing = this.#byModule.get(module) ?? new Set<string>();
		for (const name of names) existing.add(name);
		this.#byModule.set(module, existing);
	}

	render() {
		// Package imports first, then relative ones, each alphabetical, so regenerating a file
		// produces no spurious diff.
		const modules = [...this.#byModule.keys()].sort((left, right) => {
			const leftRelative = left.startsWith('.');
			const rightRelative = right.startsWith('.');
			if (leftRelative !== rightRelative) return leftRelative ? 1 : -1;
			return left.localeCompare(right);
		});

		return modules
			.map(
				(module) =>
					`import { ${[...this.#byModule.get(module)!].sort().join(', ')} } from '${module}';`
			)
			.join('\n');
	}
}

const quote = (value: string) => `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

const renderOptions = (entries: [string, string | undefined][]) => {
	const present = entries.filter(([, value]) => value !== undefined);
	return present.length
		? `{ ${present.map(([key, value]) => `${key}: ${value}`).join(', ')} }`
		: undefined;
};

/**
 * The TypeScript enum an enumerated column gets.
 *
 * Named after the entity and the property, matching what the MikroORM importer produced, so a
 * project migrating between the two importers does not see its GraphQL enum type renamed.
 */
export const enumNameFor = (entityName: string, property: string) =>
	`${entityName}${property.charAt(0).toUpperCase()}${property.slice(1)}`;

/**
 * A legal identifier for an enum member.
 *
 * Postgres will happily hold `partially-paid`, which is not a TypeScript identifier, and a value
 * that is all digits is not one either.
 */
export const identifierForEnumValue = (value: string) => {
	const identifier = value.replace(/[^a-z0-9_]/gi, '_').toUpperCase();
	return /^\d/.test(identifier) ? `_${identifier}` : identifier;
};

const renderEnum = (name: string, values: readonly string[]) =>
	[
		`export enum ${name} {`,
		...values.map((value) => `\t${identifierForEnumValue(value)} = ${quote(value)},`),
		'}',
	].join('\n');

const renderProperty = (property: PropertyModel, entityName: string, imports: Imports) => {
	if (property.enumValues?.length) {
		const enumName = enumNameFor(entityName, property.property);

		const options = renderOptions([
			['column', property.isConventional ? undefined : quote(property.column)],
			['nullable', property.nullable ? 'true' : undefined],
		]);

		imports.add(SQL, 'Field');

		return [
			`\t@Field(() => ${enumName}${options ? `, ${options}` : ''})`,
			`\t${property.property}${property.nullable ? '?' : '!'}: ${enumName};`,
		].join('\n');
	}

	const type = graphQLTypeFor(property);
	for (const entry of type.imports ?? []) imports.add(entry.module, entry.name);

	const options = renderOptions([
		['primaryKeyField', property.isPrimaryKey ? 'true' : undefined],
		// Only emitted where convention would get it wrong, which is what keeps generated files
		// readable enough that people are willing to hand-edit them.
		['column', property.isConventional ? undefined : quote(property.column)],
		['nullable', property.nullable ? 'true' : undefined],
	]);

	// This package's `@Field`, not core's: it is core's plus `column:` and friends, so one import
	// covers every field on the entity whether or not it needs anything from here.
	imports.add(SQL, 'Field');

	const optional = property.nullable ? '?' : '!';

	return [
		`\t@Field(() => ${type.expression}${options ? `, ${options}` : ''})`,
		`\t${property.property}${optional}: ${type.tsType};`,
	].join('\n');
};

const renderRelationship = (relationship: RelationshipModel, imports: Imports) => {
	if (relationship.kind === 'manyToOne') {
		imports.add(SQL, 'ManyToOne');

		const options = renderOptions([
			['column', quote(relationship.column)],
			['nullable', relationship.nullable ? 'true' : undefined],
		]);

		return [
			`\t@ManyToOne(() => ${relationship.targetEntity}${options ? `, ${options}` : ''})`,
			`\t${relationship.property}${relationship.nullable ? '?' : '!'}: ${relationship.targetEntity};`,
		].join('\n');
	}

	if (relationship.kind === 'oneToMany') {
		imports.add(SQL, 'OneToMany');

		return [
			`\t@OneToMany(() => [${relationship.targetEntity}], { relatedField: ${quote(relationship.relatedField)} })`,
			`\t${relationship.property}!: ${relationship.targetEntity}[];`,
		].join('\n');
	}

	imports.add(SQL, 'ManyToMany');

	const through = relationship.through
		? `, through: { table: ${quote(relationship.through.table)}${
				relationship.through.schema ? `, schema: ${quote(relationship.through.schema)}` : ''
			}, joinColumn: ${quote(relationship.through.joinColumn)}, inverseJoinColumn: ${quote(
				relationship.through.inverseJoinColumn
			)} }`
		: '';

	return [
		`\t@ManyToMany(() => [${relationship.targetEntity}], { relatedField: ${quote(relationship.relatedField)}${through} })`,
		`\t${relationship.property}!: ${relationship.targetEntity}[];`,
	].join('\n');
};

/**
 * Emits one entity.
 *
 * There is exactly one class per table now. The MikroORM importer wrote two -- a data entity and a
 * schema entity -- and the data entity is the one that disappears.
 */
export const renderEntityFile = (entity: EntityModel, connectionModule = '../database') => {
	const imports = new Imports();
	imports.add(CORE, 'Entity');
	imports.add(SQL, 'SqlDataProvider');
	imports.add(connectionModule, 'connection');

	for (const relationship of entity.relationships) {
		if (relationship.targetEntity === entity.name) continue;
		imports.add(`./${kebabCase(relationship.targetEntity)}`, relationship.targetEntity);
	}

	const body = [
		...entity.properties.map((property) => renderProperty(property, entity.name, imports)),
		...entity.relationships.map((relationship) => renderRelationship(relationship, imports)),
	].join('\n\n');

	// Declared here rather than in a shared file because the enum belongs to exactly one column,
	// and registered with core so the schema exposes it as a GraphQL enum rather than a String.
	const enums = entity.properties
		.filter((property) => property.enumValues?.length)
		.map((property) => {
			const name = enumNameFor(entity.name, property.property);
			imports.add(CORE, 'graphweaverMetadata');

			return `${renderEnum(name, property.enumValues!)}

graphweaverMetadata.collectEnumInformation({ name: ${quote(name)}, target: ${name} });`;
		});

	const providerOptions = renderOptions([
		['table', entity.tableIsConventional ? undefined : quote(entity.table)],
		['schema', entity.schema ? quote(entity.schema) : undefined],
	]);

	const entityOptions = [
		`\tprovider: new SqlDataProvider(() => ${entity.name}, connection${providerOptions ? `, ${providerOptions}` : ''}),`,
		entity.clientGeneratedPrimaryKeys
			? '\tapiOptions: { clientGeneratedPrimaryKeys: true },'
			: undefined,
	]
		.filter(Boolean)
		.join('\n');

	return `${imports.render()}

${enums.length ? `${enums.join('\n\n')}\n\n` : ''}@Entity<${entity.name}>(${quote(entity.name)}, {
${entityOptions}
})
export class ${entity.name} {
${body}
}
`;
};

export const renderIndexFile = (entities: EntityModel[]) =>
	`${entities
		.map((entity) => `export * from './${kebabCase(entity.name)}';`)
		.sort()
		.join('\n')}\n`;
