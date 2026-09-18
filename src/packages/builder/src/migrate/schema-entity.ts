import { Node, SyntaxKind } from 'ts-morph';
import type {
	ClassDeclaration,
	ObjectLiteralExpression,
	PropertyDeclaration,
	SourceFile,
} from 'ts-morph';
import { snakeCase } from '@exogee/graphweaver-sql';
import type { OrmEntity, OrmProperty } from './orm-entity';

export interface MigrationIssue {
	file: string;
	entity: string;
	property?: string;
	message: string;
}

const SQL_PACKAGE = '@exogee/graphweaver-sql';

/** Adds named imports to a module, creating the import if it is not already there. */
const ensureImport = (file: SourceFile, module: string, ...names: string[]) => {
	const existing = file.getImportDeclaration(
		(declaration) => declaration.getModuleSpecifierValue() === module
	);

	if (!existing) {
		file.addImportDeclaration({ moduleSpecifier: module, namedImports: names });
		return;
	}

	const already = new Set(existing.getNamedImports().map((entry) => entry.getName()));
	for (const name of names) if (!already.has(name)) existing.addNamedImport(name);
};

const removeNamedImport = (file: SourceFile, module: string, name: string) => {
	const declaration = file.getImportDeclaration(
		(entry) => entry.getModuleSpecifierValue() === module
	);
	if (!declaration) return;

	declaration
		.getNamedImports()
		.find((entry) => entry.getName() === name)
		?.remove();

	if (!declaration.getNamedImports().length && !declaration.getDefaultImport()) {
		declaration.remove();
	}
};

/** `{ a: 1 }` -> the text of its properties, so options can be rebuilt while preserving the rest. */
const optionEntries = (object: ObjectLiteralExpression | undefined, drop: string[] = []) =>
	(object?.getProperties() ?? [])
		.filter((property) => {
			const name = Node.isPropertyAssignment(property) ? property.getName() : undefined;
			return !name || !drop.includes(name);
		})
		.map((property) => property.getText());

const quote = (value: string) => `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`;

const objectArgument = (call: { getArguments(): Node[] }): ObjectLiteralExpression | undefined =>
	call
		.getArguments()
		.find((argument): argument is ObjectLiteralExpression =>
			Node.isObjectLiteralExpression(argument)
		);

/**
 * Rewrites one Graphweaver entity to use the SQL provider.
 *
 * Edits in place rather than regenerating. The schema entity is where all the hand-written work
 * lives -- hooks, adminUIOptions, descriptions, field resolvers, permissions -- and regenerating it
 * would throw that away, which is exactly why "just re-import" is not an acceptable migration.
 */
export const migrateSchemaEntity = (
	file: SourceFile,
	entityClass: ClassDeclaration,
	orm: OrmEntity,
	ormClassAlias: string,
	/** Every ORM entity in the project, keyed by class name, so relationships can be resolved. */
	ormEntities: Map<string, OrmEntity>,
	/** The schema entities being migrated, so cross-datasource relationships can be left alone. */
	migratedEntities: ReadonlySet<string>
): MigrationIssue[] => {
	const issues: MigrationIssue[] = [];
	const entityName = entityClass.getName() ?? '';
	const note = (message: string, property?: string) =>
		issues.push({ file: file.getFilePath(), entity: entityName, property, message });

	const entityDecorator = entityClass.getDecorator('Entity');
	const entityOptions = entityDecorator ? objectArgument(entityDecorator) : undefined;
	const providerProperty = entityOptions?.getProperty('provider');

	if (!Node.isPropertyAssignment(providerProperty)) {
		note('Could not find the provider on the @Entity decorator.');
		return issues;
	}

	const providerCall = providerProperty.getInitializerIfKind(SyntaxKind.NewExpression);
	if (!providerCall) {
		note('The provider is not a `new MikroBackendProvider(...)` call.');
		return issues;
	}

	// The third argument carries things like backendDisplayName, which are still supported.
	const carriedOptions = optionEntries(objectArgument(providerCall));
	const connectionArgument = providerCall.getArguments()[1]?.getText() ?? 'connection';

	const tableIsConventional = !orm.table || snakeCase.tableName(entityName) === orm.table;
	const providerOptions = [
		...(tableIsConventional ? [] : [`table: ${quote(orm.table!)}`]),
		...(orm.schema ? [`schema: ${quote(orm.schema)}`] : []),
		...carriedOptions,
	];

	providerProperty.setInitializer(
		`new SqlDataProvider(() => ${entityName}, ${connectionArgument}${
			providerOptions.length ? `, { ${providerOptions.join(', ')} }` : ''
		})`
	);

	ensureImport(file, SQL_PACKAGE, 'SqlDataProvider');
	removeNamedImport(file, '@exogee/graphweaver-mikroorm', 'MikroBackendProvider');

	const usedDecorators = new Set<string>();
	// ORM scalars that turned out to be a relationship's foreign key, so they are not also hidden.
	const consumedByRelationships = new Set<string>();

	for (const property of entityClass.getProperties()) {
		const name = property.getName();
		let ormProperty = orm.properties.get(name);

		// The @ExternalIdField pattern: the ORM entity holds a scalar foreign key like `userId`
		// and the schema entity exposes `user` with `id: (entity) => entity.userId`. There is no
		// ORM property called `user` at all, so follow the accessor to find the real column.
		if (!ormProperty) {
			const viaId = foreignKeyPropertyFor(property);
			const referenced = viaId ? orm.properties.get(viaId) : undefined;

			if (referenced && !targetIsMigrating(property, migratedEntities)) {
				note(
					`Left as a @RelationshipField: it points at an entity that is not backed by this ` +
						`database, so core resolves it through that entity's own provider.`,
					name
				);
				continue;
			}

			if (referenced) {
				consumedByRelationships.add(viaId!);
				ormProperty = {
					...referenced,
					name,
					kind: 'manyToOne',
					// The scalar's own column is the foreign key.
					fieldName: referenced.fieldName ?? snakeCase.columnName(viaId!),
				};
			}
		}

		if (!ormProperty) {
			// A field with no counterpart in the ORM entity is a field resolver or something
			// hand-written; leave it exactly as it is.
			continue;
		}

		if (ormProperty.unsupported) {
			property.addJsDoc(
				`TODO(graphweaver): could not migrate this automatically -- ${ormProperty.unsupported}.`
			);
			note(ormProperty.unsupported, name);
			continue;
		}

		const decorator = property.getDecorator('Field') ?? property.getDecorator('RelationshipField');
		if (!decorator) continue;

		const typeArgument = decorator.getArguments()[0]?.getText();
		const options = objectArgument(decorator);

		if (ormProperty.kind === 'scalar') {
			const column = ormProperty.fieldName;
			const conventional = !column || snakeCase.columnName(name) === column;

			// A plain @Field already means "a column by convention", so only write the override
			// when there is genuinely one to record. `column:` is a SQL option merged into core's
			// `AdapterFieldOptions`, so the decorator stays `@Field` either way.
			if (conventional) continue;

			const entries = [`column: ${quote(column!)}`, ...optionEntries(options)];
			decorator.replaceWithText(`@Field(${typeArgument}, { ${entries.join(', ')} })`);

			// Still spelled `@Field`, but it has to be the SQL package's one from here on: core's
			// does not accept `column:`. It is a superset, so switching the import covers the
			// entity's other fields too, including the ones left untouched.
			usedDecorators.add('Field');
			continue;
		}

		if (ormProperty.kind === 'manyToOne') {
			const column = ormProperty.fieldName;
			const entries = [
				...(column ? [`column: ${quote(column)}`] : []),
				...optionEntries(options, ['id']),
			];

			decorator.replaceWithText(
				`@ManyToOne(${typeArgument}${entries.length ? `, { ${entries.join(', ')} }` : ''})`
			);
			usedDecorators.add('ManyToOne');

			if (!column) {
				note(
					`No foreign key column was declared, so the naming strategy will derive ` +
						`'${snakeCase.foreignKeyColumn(name)}'. Check that is right.`,
					name
				);
			}
			continue;
		}

		if (ormProperty.kind === 'oneToMany') {
			const relatedField = ormProperty.mappedBy;

			if (!relatedField) {
				property.addJsDoc(
					'TODO(graphweaver): could not migrate this automatically -- the one-to-many has no mappedBy.'
				);
				note('One-to-many with no mappedBy, so the inverse field is unknown.', name);
				continue;
			}

			const entries = [
				`relatedField: ${quote(relatedField)}`,
				...optionEntries(options, ['relatedField']),
			];
			decorator.replaceWithText(`@OneToMany(${typeArgument}, { ${entries.join(', ')} })`);
			usedDecorators.add('OneToMany');
			continue;
		}

		// Many to many. The owning side declares the pivot; both sides name the other's field.
		const relatedField = ormProperty.mappedBy ?? inverseFieldFor(orm, ormProperty, ormEntities);

		if (!relatedField) {
			property.addJsDoc(
				'TODO(graphweaver): could not migrate this automatically -- could not work out the ' +
					'field on the other side of this many-to-many.'
			);
			note('Many-to-many whose inverse field could not be determined.', name);
			continue;
		}

		// Only the owning side declares the pivot. Where MikroORM was deriving the name by
		// convention rather than being told it, derive the same name -- but say so, because it is
		// the one thing here that is a guess about the actual database.
		const derivedPivot =
			!ormProperty.pivot && ormProperty.owner
				? {
						table: `${snakeCase.tableName(orm.className)}_${snakeCase.columnName(name)}`,
						joinColumn: `${snakeCase.tableName(orm.className)}_id`,
						inverseJoinColumn: `${snakeCase.tableName(ormProperty.targetClass ?? '')}_id`,
					}
				: undefined;

		if (derivedPivot) {
			note(
				`No pivotTable was declared, so the pivot was derived from MikroORM's naming ` +
					`convention as '${derivedPivot.table}' (${derivedPivot.joinColumn}, ` +
					`${derivedPivot.inverseJoinColumn}). Check that against your database.`,
				name
			);
		}

		const pivot = ormProperty.pivot ?? derivedPivot;

		const through = pivot
			? `, through: { table: ${quote(pivot.table)}${
					pivot.joinColumn ? `, joinColumn: ${quote(pivot.joinColumn)}` : ''
				}${
					pivot.inverseJoinColumn ? `, inverseJoinColumn: ${quote(pivot.inverseJoinColumn)}` : ''
				} }`
			: '';

		const entries = [
			`relatedField: ${quote(relatedField)}`,
			...optionEntries(options, ['relatedField']),
		];

		decorator.replaceWithText(`@ManyToMany(${typeArgument}, { ${entries.join(', ')}${through} })`);
		usedDecorators.add('ManyToMany');
	}

	// Anything the ORM entity stored that the schema entity never exposed is a hidden column.
	const hidden = [...orm.properties.values()].filter(
		(ormProperty) =>
			ormProperty.kind === 'scalar' &&
			!ormProperty.unsupported &&
			!consumedByRelationships.has(ormProperty.name) &&
			!entityClass.getProperty(ormProperty.name)
	);

	if (hidden.length) {
		note(
			`These columns exist in the database but not in the API, so they were moved to the ` +
				`provider's \`hidden\` map: ${hidden.map((entry) => entry.name).join(', ')}.`
		);
		addHiddenColumns(providerProperty, entityName, hidden, file);
	}

	if (usedDecorators.size) ensureImport(file, SQL_PACKAGE, ...usedDecorators);

	// Drop core imports nothing uses any more. An entity whose every field became a relationship
	// leaves `Field` imported and unused, which is a lint error in a file the user did not touch.
	for (const name of ['Field', 'RelationshipField']) {
		// `Field` now resolving to the SQL package means core's import has to go regardless of how
		// many `@Field` decorators are left, or the file declares the same name twice.
		if (name === 'Field' && usedDecorators.has('Field')) {
			removeNamedImport(file, '@exogee/graphweaver', 'Field');
			continue;
		}

		const stillUsed = entityClass.getProperties().some((property) => property.getDecorator(name));

		// Another entity in the same file might still use it.
		const usedElsewhere = file
			.getClasses()
			.filter((declaration) => declaration !== entityClass)
			.some((declaration) =>
				declaration.getProperties().some((property) => property.getDecorator(name))
			);

		if (!stillUsed && !usedElsewhere) removeNamedImport(file, '@exogee/graphweaver', name);
	}

	// The ORM class is no longer referenced by anything.
	file.getImportDeclarations().forEach((declaration) =>
		declaration
			.getNamedImports()
			.find((entry) => (entry.getAliasNode()?.getText() ?? entry.getName()) === ormClassAlias)
			?.remove()
	);
	file
		.getImportDeclarations()
		.filter(
			(declaration) =>
				!declaration.getNamedImports().length &&
				!declaration.getDefaultImport() &&
				!declaration.getNamespaceImport()
		)
		.forEach((declaration) => declaration.remove());

	return issues;
};

/** True when the entity on the other end of a relationship is also moving to the SQL provider. */
const targetIsMigrating = (
	property: PropertyDeclaration,
	migratedEntities: ReadonlySet<string>
) => {
	const decorator = property.getDecorator('RelationshipField');
	const target = decorator?.getArguments()[0];

	if (!Node.isArrowFunction(target)) return false;

	const body = target.getBody();
	const name = Node.isArrayLiteralExpression(body)
		? body.getElements()[0]?.getText()
		: body.getText();

	return name ? migratedEntities.has(name) : false;
};

/**
 * Reads `id: (entity) => entity.userId` off a @RelationshipField and returns `userId`.
 *
 * This is how the MikroORM provider expressed a many-to-one without the schema entity knowing about
 * the column, so it is very common in existing projects.
 */
const foreignKeyPropertyFor = (property: PropertyDeclaration): string | undefined => {
	const decorator = property.getDecorator('RelationshipField');
	const options = decorator ? objectArgument(decorator) : undefined;
	const idOption = options?.getProperty('id');

	if (!Node.isPropertyAssignment(idOption)) return undefined;

	const initialiser = idOption.getInitializer();

	// `id: 'userId'` names the property directly.
	if (Node.isStringLiteral(initialiser)) return initialiser.getLiteralValue();

	if (!Node.isArrowFunction(initialiser)) return undefined;

	// `entity.userId` or `entity.user?.id`; only the first form names a column on this table.
	const body = initialiser.getBody();
	if (!Node.isPropertyAccessExpression(body)) return undefined;
	if (!Node.isIdentifier(body.getExpression())) return undefined;

	return body.getName();
};

/**
 * Finds the field on the other entity that points back, for a many-to-many owning side.
 *
 * MikroORM only records the pairing on the inverse side, as `mappedBy`. So from the owning side the
 * answer is not in this entity at all: it is the property on the target whose `mappedBy` names us.
 */
const inverseFieldFor = (
	orm: OrmEntity,
	property: OrmProperty,
	ormEntities: Map<string, OrmEntity>
) => {
	if (!property.targetClass) return undefined;

	const target = ormEntities.get(property.targetClass);
	if (!target) return undefined;

	const inverse = [...target.properties.values()].find(
		(candidate) =>
			candidate.kind === 'manyToMany' &&
			candidate.mappedBy === property.name &&
			candidate.targetClass === orm.className
	);

	return inverse?.name;
};

const addHiddenColumns = (
	providerProperty: Node,
	entityName: string,
	hidden: OrmProperty[],
	file: SourceFile
) => {
	void file;
	if (!Node.isPropertyAssignment(providerProperty)) return;

	const call = providerProperty.getInitializerIfKind(SyntaxKind.NewExpression);
	if (!call) return;

	const entries = hidden
		.map(
			(property) =>
				`${property.name}: { type: 'string'${
					property.fieldName ? `, column: ${quote(property.fieldName)}` : ''
				}${property.nullable ? ', nullable: true' : ''} }`
		)
		.join(', ');

	const existing = objectArgument(call);
	const hiddenEntry = `hidden: { ${entries} }`;

	if (existing) {
		existing.addPropertyAssignment({
			name: 'hidden',
			initializer: `{ ${entries} }`,
		});
	} else {
		call.addArgument(`{ ${hiddenEntry} }`);
	}

	// The storage interface the generic needs. Written above the class so it is easy to find.
	const storageName = `${entityName}Storage`;
	if (!file.getInterface(storageName)) {
		file.insertInterface(file.getClass(entityName)?.getChildIndex() ?? 0, {
			name: storageName,
			isExported: true,
			properties: hidden.map((property) => ({
				name: property.name,
				type: 'string',
				hasQuestionToken: property.nullable,
			})),
			docs: [
				'Columns that exist in the database but are deliberately not part of the API.\n' +
					'Reachable from custom queries and access control filters through the provider.',
			],
		});
	}

	call.replaceWithText(
		call
			.getText()
			.replace('new SqlDataProvider(', `new SqlDataProvider<${entityName}, ${storageName}>(`)
	);
};
