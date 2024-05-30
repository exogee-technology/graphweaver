import {
	CreateOrUpdateHookParams,
	DeleteHookParams,
	GraphQLArgs,
	ReadHookParams,
	graphweaverMetadata,
	EntityMetadata,
	isEntityMetadata,
	ResolveTree,
	Filter,
	isTopLevelFilterProperty,
} from '@exogee/graphweaver';
import { logger } from '@exogee/logger';

import { AccessType, AuthorizationContext } from '../../types';
import { andFilters } from '../../helper-functions';
import {
	GENERIC_AUTH_ERROR_MESSAGE,
	assertUserCanPerformRequestedAction,
	checkAuthorization,
	getACL,
	getAccessFilter,
	isPopulatedFilter,
} from '../../auth-utils';

const metadata = graphweaverMetadata;

// This function is called recursively on each nested relationship node of an input arg
// Relationships can be nested multiple levels deep so we need to check each level
// The function will determine the access type of the relationship node based on the fields it contains
// This is a pre hook and is called before any data provider is called
// ❗ DELETE is not checked as it is possible a nested entity is being deleted and this must be checked after the data provider is called ❗
// ❗ Therefore, this is not an exhaustive check and only infers the access type based on the fields in the node ❗
const getRelationshipAccessTypeForArg = (
	entityMetadata: EntityMetadata<any, any>,
	node: unknown
): AccessType => {
	const primaryKeyField = graphweaverMetadata.primaryKeyFieldForEntity(entityMetadata);

	// If we have an object with only a primary key then we are reading
	if (
		typeof node === 'object' &&
		node !== null &&
		Object.keys(node).length === 1 &&
		Object.prototype.hasOwnProperty.call(node, primaryKeyField)
	) {
		return AccessType.Read;
	}

	// If we have an object with a id and other fields then we are updating
	if (
		typeof node === 'object' &&
		node !== null &&
		Object.keys(node).length > 1 &&
		Object.prototype.hasOwnProperty.call(node, primaryKeyField)
	) {
		return AccessType.Update;
	}

	// If we have an object with no id then we are creating
	if (
		typeof node === 'object' &&
		node !== null &&
		!Object.prototype.hasOwnProperty.call(node, primaryKeyField)
	) {
		return AccessType.Create;
	}

	throw new Error('Unrecognized node access type, unable to apply permissions');
};

// In order to support Row Level Security, we need to ensure that the hooks are transactional
// This is checked in the Create and Update hooks when we find a ACL filter
const assertTransactional = (transactional: boolean) => {
	if (!transactional) {
		logger.error(
			'Row Level Security can only be applied within a transaction and this hook is not transactional.'
		);
		throw new Error(GENERIC_AUTH_ERROR_MESSAGE);
	}
};

type EntityName = string;
type RequiredPermission = `${EntityName}:${AccessType}`;
// This function walks through the selection set and checks each relationship field to see if it is an entity and if so, checks the ACL
// This is not checking the filter only the boolean permission
// This is checked in all before hooks and before calling the data provider
const assertUserCanPerformRequest = async <G>(
	gqlEntityTypeName: string,
	fields: ResolveTree | undefined,
	args: GraphQLArgs<G>,
	accessType: AccessType
) => {
	const entityMetadata = graphweaverMetadata.getEntityByName(gqlEntityTypeName);
	if (!entityMetadata) throw new Error(`Could not locate entity by name ${gqlEntityTypeName}.`);

	const permissionsFromFields: RequiredPermission[] = [];
	const permissionsFromFilterArgsOnFields: RequiredPermission[] = [];

	if (fields) {
		permissionsFromFields.push(...generatePermissionListFromFields(entityMetadata, fields));
		permissionsFromFilterArgsOnFields.push(...getFilterArgumentsOnFields(entityMetadata, fields));
	}

	const permissionsFromInputArgs = args.items
		? generatePermissionListFromArgs()(gqlEntityTypeName, args.items, accessType)
		: [];

	const permissionsFromFilterArgs = args.filter
		? generatePermissionListFromArgs()(gqlEntityTypeName, [args.filter], accessType, true)
		: [];

	const permissionsList = new Set([
		...permissionsFromFields,
		...permissionsFromInputArgs,
		...permissionsFromFilterArgs,
		...permissionsFromFilterArgsOnFields,
	]);

	// Check the permissions
	for (const permission of permissionsList) {
		const [entityName, action] = permission.split(':');
		const acl = getACL(entityName);
		await assertUserCanPerformRequestedAction(acl, action as AccessType);
	}
};

const generatePermissionListFromFields = <G>(
	entityMetadata: EntityMetadata<G>,
	requestedFields: ResolveTree
) => {
	const permissionsList: RequiredPermission[] = [`${entityMetadata.name}:${AccessType.Read}`];

	for (const fields of Object.values(requestedFields.fieldsByTypeName)) {
		for (const fieldValue of Object.values(fields)) {
			const fieldMetadata = entityMetadata.fields[fieldValue.name];
			const fieldType = fieldMetadata.getType();
			const fieldTypeMetadata = graphweaverMetadata.metadataForType(fieldType);
			if (isEntityMetadata(fieldTypeMetadata)) {
				permissionsList.push(...generatePermissionListFromFields(fieldTypeMetadata, fieldValue));
			}
		}
	}

	return permissionsList;
};

// Check at each level of the resolve tree if there is a filter arg, and if so, recurse down it to make sure we're allowed to do
// everything in the filter.
const getFilterArgumentsOnFields = (entityMetadata: EntityMetadata, resolveTree: ResolveTree) => {
	const permissionsList: RequiredPermission[] = [];

	const recurseThroughArg = (entityMetadata: EntityMetadata, filter: Filter<unknown>) => {
		permissionsList.push(`${entityMetadata.name}:${AccessType.Read}`);

		for (const [filterKey, value] of Object.entries(filter)) {
			const fieldMetadata = graphweaverMetadata.fieldMetadataForFilterKey(
				entityMetadata,
				filterKey
			);

			if (!fieldMetadata) {
				throw new Error(
					`Could not determine field metadata for filter key: '${filterKey} on ${entityMetadata.name} entity'`
				);
			}

			const fieldType = fieldMetadata.getType();
			const fieldTypeMetadata = graphweaverMetadata.metadataForType(fieldType);
			if (isTopLevelFilterProperty(filterKey)) {
				value.forEach((item) => {
					recurseThroughArg(entityMetadata, item);
				});
			} else if (isEntityMetadata(fieldTypeMetadata)) {
				recurseThroughArg(fieldTypeMetadata, value as Filter<unknown>);
			}
		}
	};

	if (resolveTree.args.filter) {
		recurseThroughArg(entityMetadata, resolveTree.args.filter as Filter<unknown>);
	}

	for (const fields of Object.values(resolveTree.fieldsByTypeName)) {
		for (const fieldValue of Object.values(fields)) {
			const fieldMetadata = entityMetadata.fields[fieldValue.name];
			const fieldType = fieldMetadata.getType();
			const fieldTypeMetadata = graphweaverMetadata.metadataForType(fieldType);

			if (isEntityMetadata(fieldTypeMetadata)) {
				permissionsList.push(...getFilterArgumentsOnFields(fieldTypeMetadata, fieldValue));
			}
		}
	}

	return permissionsList;
};

// Returns a function that walks through the input arguments and checks their type to see which type of operation is being performed and adds the required permission to the list
const generatePermissionListFromArgs = <G>() => {
	const permissionsList: RequiredPermission[] = [];

	const recurseThroughArgs = (
		entityName: string,
		argumentNode: Partial<G>[],
		accessType: AccessType,
		filter: boolean = false
	) => {
		for (const node of argumentNode) {
			if (filter) {
				permissionsList.push(`${entityName}:${AccessType.Read}`);
			} else {
				// We are an input argument so we need to check the access type
				switch (accessType) {
					case AccessType.Read:
						permissionsList.push(`${entityName}:${AccessType.Read}`);
						break;
					case AccessType.Create:
						permissionsList.push(`${entityName}:${AccessType.Create}`);
						break;
					case AccessType.Update:
						permissionsList.push(`${entityName}:${AccessType.Update}`);
						break;
					case AccessType.Delete:
						permissionsList.push(`${entityName}:${AccessType.Delete}`);
						break;
					default:
						throw new Error('Unrecognized access type, unable to apply permissions');
				}
			}

			// Now we have an array or an object lets see if its a related entity
			const entityFields = metadata.getEntityByName(entityName)?.fields;

			for (const [key, value] of Object.entries(node)) {
				// If we are here then we have an array or an object lets see if its a related entity
				const relationship = entityFields?.[key];
				const relatedEntityMetadata = graphweaverMetadata.metadataForType(relationship?.getType());

				if (isEntityMetadata(relatedEntityMetadata)) {
					const relationshipNodes = Array.isArray(value) ? value : [value];

					// We need to loop through the relationship nodes and check the access type as it could be a mixture of read, create, update
					for (const relationshipNode of relationshipNodes) {
						// Check the access type of the relationship
						const relationshipAccessType = filter
							? accessType
							: getRelationshipAccessTypeForArg(relatedEntityMetadata, relationshipNode);

						// Let's check the user has permission to read the related entity
						recurseThroughArgs(
							relatedEntityMetadata.name,
							[relationshipNode],
							relationshipAccessType,
							filter
						);
					}
				}
			}
		}

		return permissionsList;
	};

	return recurseThroughArgs;
};

export const beforeCreateOrUpdate = (
	gqlEntityTypeName: string,
	accessType: AccessType.Create | AccessType.Update
) => {
	return async <G>(params: CreateOrUpdateHookParams<G, AuthorizationContext>) => {
		// 1. Check permissions for this entity based on the currently logged in user
		await assertUserCanPerformRequest(gqlEntityTypeName, params.fields, params.args, accessType);
		// 2. Fetch the ACL for this entity
		const acl = getACL(gqlEntityTypeName);
		// 3. Fetch the filter for the currently logged in user
		const accessFilter = await getAccessFilter(acl, accessType);
		// 4. Check if the filter has values and then assert we are in a transaction
		// You can only use a filter in this way when you are in a transaction
		if (isPopulatedFilter(accessFilter)) assertTransactional(params.transactional);

		return params;
	};
};

export const afterCreateOrUpdate = (
	gqlEntityTypeName: string,
	accessType: AccessType.Create | AccessType.Update
) => {
	return async <G>(params: CreateOrUpdateHookParams<G, AuthorizationContext>) => {
		const entityMetadata = graphweaverMetadata.getEntityByName(gqlEntityTypeName);
		if (!entityMetadata) throw new Error(`Could not locate entity '${gqlEntityTypeName}' by name.`);
		const primaryKeyField = graphweaverMetadata.primaryKeyFieldForEntity(entityMetadata) as keyof G;

		const items = params.args.items;
		const entities = (params.entities ?? []) as G[];

		// 1. Check to ensure we are within a transaction
		assertTransactional(params.transactional);
		// 2. Check user has permission for each for each entity
		const authChecks = entities.map((entity, index) =>
			entity?.[primaryKeyField]
				? checkAuthorization(
						gqlEntityTypeName,
						typeof entity[primaryKeyField] === 'number'
							? Number(entity[primaryKeyField])
							: String(entity[primaryKeyField]),
						items[index],
						accessType
					)
				: undefined
		);
		await Promise.all(authChecks);
		return params;
	};
};

export const beforeRead = (gqlEntityTypeName: string) => {
	return async <G>(params: ReadHookParams<G, AuthorizationContext>) => {
		// 1. Check permissions for this entity based on the currently logged in user
		await assertUserCanPerformRequest(
			gqlEntityTypeName,
			params.fields,
			params.args,
			AccessType.Read
		);
		// 2. Fetch the ACL for this entity
		const acl = getACL(gqlEntityTypeName);
		// 3. Combine the access filter with the original filter
		const accessFilter = await getAccessFilter(acl, AccessType.Read);
		const consolidatedFilter = andFilters(params.args.filter, accessFilter);

		return {
			...params,
			args: {
				...params.args,
				filter: consolidatedFilter,
			},
		};
	};
};

export const beforeDelete = (gqlEntityTypeName: string) => {
	return async <G>(params: DeleteHookParams<G, AuthorizationContext>) => {
		// 1. Check permissions for this entity based on the currently logged in user
		await assertUserCanPerformRequest(
			gqlEntityTypeName,
			params.fields,
			params.args,
			AccessType.Delete
		);
		// 2. Fetch the ACL for this entity
		const acl = getACL(gqlEntityTypeName);
		// 3. Combine the access filter with the original filter
		const accessFilter = await getAccessFilter(acl, AccessType.Delete);
		const consolidatedFilter = andFilters(params.args.filter, accessFilter);

		return {
			...params,
			args: {
				...params.args,
				filter: consolidatedFilter,
			},
		};
	};
};
