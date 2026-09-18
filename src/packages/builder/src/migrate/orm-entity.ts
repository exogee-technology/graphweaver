import type {
	ClassDeclaration,
	Decorator,
	ObjectLiteralExpression,
	PropertyDeclaration,
} from 'ts-morph';
import { Node, SyntaxKind } from 'ts-morph';

/** What we can learn about storage from a MikroORM entity. */
export interface OrmEntity {
	className: string;
	table?: string;
	schema?: string;
	properties: Map<string, OrmProperty>;
}

export interface OrmProperty {
	name: string;
	/** The column, where the entity names one. */
	fieldName?: string;
	kind: 'scalar' | 'manyToOne' | 'oneToMany' | 'manyToMany';
	isPrimaryKey: boolean;
	nullable: boolean;
	autoincrement: boolean;
	/** manyToOne / oneToMany / manyToMany: the entity on the other end. */
	targetClass?: string;
	/** oneToMany / manyToMany inverse side. */
	mappedBy?: string;
	/** manyToMany owning side. */
	pivot?: { table: string; joinColumn?: string; inverseJoinColumn?: string };
	/** manyToMany: `owner: true` marks the side that defines the pivot. */
	owner?: boolean;
	/** Anything we recognised but could not model, reported rather than guessed at. */
	unsupported?: string;
}

const decoratorNamed = (node: ClassDeclaration | PropertyDeclaration, ...names: string[]) =>
	node.getDecorators().find((decorator) => names.includes(decorator.getName()));

const objectArgument = (decorator: Decorator): ObjectLiteralExpression | undefined =>
	decorator
		.getArguments()
		.find((argument): argument is ObjectLiteralExpression =>
			Node.isObjectLiteralExpression(argument)
		);

const stringProperty = (object: ObjectLiteralExpression | undefined, name: string) => {
	const property = object?.getProperty(name);
	if (!property || !Node.isPropertyAssignment(property)) return undefined;

	const initialiser = property.getInitializer();
	return Node.isStringLiteral(initialiser) ? initialiser.getLiteralValue() : undefined;
};

const booleanProperty = (object: ObjectLiteralExpression | undefined, name: string) => {
	const property = object?.getProperty(name);
	if (!property || !Node.isPropertyAssignment(property)) return undefined;

	const initialiser = property.getInitializer();
	if (initialiser?.getKind() === SyntaxKind.TrueKeyword) return true;
	if (initialiser?.getKind() === SyntaxKind.FalseKeyword) return false;
	return undefined;
};

/** Reads the inverse side from a positional `(task) => task.tags` argument. */
const inverseFromPositionalArrow = (decorator: Decorator): string | undefined => {
	for (const argument of decorator.getArguments()) {
		if (!Node.isArrowFunction(argument)) continue;
		// The first arrow is `() => Entity`; the inverse one takes a parameter.
		if (argument.getParameters().length === 0) continue;

		const body = argument.getBody();
		if (Node.isPropertyAccessExpression(body)) return body.getName();
	}

	return undefined;
};

/** Reads `entity: () => Track` or the first positional `() => Track`. */
const targetClassFrom = (decorator: Decorator, object?: ObjectLiteralExpression) => {
	const fromOption = object?.getProperty('entity');
	const candidates = [
		Node.isPropertyAssignment(fromOption) ? fromOption.getInitializer() : undefined,
		...decorator.getArguments(),
	];

	for (const candidate of candidates) {
		if (!candidate) continue;

		if (Node.isArrowFunction(candidate)) {
			const body = candidate.getBody();
			if (Node.isIdentifier(body)) return body.getText();
		}
	}

	return undefined;
};

/**
 * Reads a MikroORM entity class.
 *
 * Only the storage facts matter: which table, which column, which relationship. Everything else on
 * these classes -- the MikroORM types, the `Collection` wrappers -- exists to satisfy the ORM and
 * goes away with it.
 */
export const readOrmEntity = (declaration: ClassDeclaration): OrmEntity => {
	const entityDecorator = decoratorNamed(declaration, 'Entity');
	const entityOptions = entityDecorator ? objectArgument(entityDecorator) : undefined;

	const properties = new Map<string, OrmProperty>();

	for (const property of declaration.getProperties()) {
		const name = property.getName();

		const primaryKey = decoratorNamed(property, 'PrimaryKey');
		const scalar = decoratorNamed(property, 'Property', 'Enum');
		const manyToOne = decoratorNamed(property, 'ManyToOne');
		const oneToMany = decoratorNamed(property, 'OneToMany');
		const manyToMany = decoratorNamed(property, 'ManyToMany');
		const unsupportedDecorator = decoratorNamed(property, 'Formula', 'Embedded', 'OneToOne');

		const decorator = primaryKey ?? scalar ?? manyToOne ?? oneToMany ?? manyToMany;
		if (!decorator && !unsupportedDecorator) continue;

		if (unsupportedDecorator) {
			properties.set(name, {
				name,
				kind: 'scalar',
				isPrimaryKey: false,
				nullable: false,
				autoincrement: false,
				unsupported: `@${unsupportedDecorator.getName()} has no equivalent in the SQL provider`,
			});
			continue;
		}

		const options = objectArgument(decorator!);

		properties.set(name, {
			name,
			fieldName: stringProperty(options, 'fieldName'),
			kind: manyToOne
				? 'manyToOne'
				: oneToMany
					? 'oneToMany'
					: manyToMany
						? 'manyToMany'
						: 'scalar',
			isPrimaryKey: Boolean(primaryKey),
			nullable: booleanProperty(options, 'nullable') ?? false,
			autoincrement: booleanProperty(options, 'autoincrement') ?? Boolean(primaryKey),
			targetClass:
				manyToOne || oneToMany || manyToMany ? targetClassFrom(decorator!, options) : undefined,
			mappedBy:
				stringProperty(options, 'mappedBy') ??
				(oneToMany || manyToMany ? inverseFromPositionalArrow(decorator!) : undefined),
			owner: booleanProperty(options, 'owner') ?? undefined,
			pivot: manyToMany
				? (() => {
						const table = stringProperty(options, 'pivotTable');
						return table
							? {
									table,
									joinColumn: stringProperty(options, 'joinColumn'),
									inverseJoinColumn: stringProperty(options, 'inverseJoinColumn'),
								}
							: undefined;
					})()
				: undefined,
		});
	}

	return {
		className: declaration.getName() ?? '',
		table: stringProperty(entityOptions, 'tableName'),
		schema: stringProperty(entityOptions, 'schema'),
		properties,
	};
};
