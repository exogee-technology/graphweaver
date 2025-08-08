import {
	CreateOrUpdateHookParams,
	DeleteHookParams,
	EntityMetadata,
	Filter,
	GraphQLArgs,
	ReadHookParams,
	ResolveTree,
	graphweaverMetadata,
	isEntityMetadata,
	isTopLevelFilterProperty,
} from '@exogee/graphweaver';
import { logger } from '@exogee/logger';

import {
	FieldDetails,
	GENERIC_AUTH_ERROR_MESSAGE,
	assertUserCanPerformRequestedAction,
	assertUserHasAccessToField,
	checkAuthorization,
	getACL,
	getAccessFilter,
	isPopulatedFilter,
} from '../../auth-utils';
import { FieldLocation } from '../../errors';
import { andFilters } from '../../helper-functions';
import { AccessType, AuthorizationContext } from '../../types';

const aggregatePattern = /_aggregate$/;

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

enum RequirePermissionType {
	ENTITY = 'ENTITY',
	FIELD = 'FIELD',
}

type RequiredPermission = {
	entityName: string;
	type: RequirePermissionType;
	accessType: AccessType;
	field?: FieldDetails;
};
// This function walks through the selection set and checks each relationship field to see if it is an entity and if so, checks the ACL
// This is not checking the filter only the boolean permission
// This is checked in all before hooks and before calling the data provider
const assertUserCanPerformRequest = async <G, TContext extends AuthorizationContext>(
	gqlEntityTypeName: string,
	fields: ResolveTree | undefined,
	args: GraphQLArgs<G>,
	accessType: AccessType,
	context: TContext
) => {
	const entityMetadata = graphweaverMetadata.getEntityByName(gqlEntityTypeName);
	if (!entityMetadata) throw new Error(`Could not locate entity by name ${gqlEntityTypeName}.`);

	const permissionsFromFields: RequiredPermission[] = [];
	const permissionsFromFilterArgsOnFields: RequiredPermission[] = [];

	if (fields) {
		permissionsFromFields.push(...generatePermissionListFromFields(entityMetadata, fields));
		permissionsFromFilterArgsOnFields.push(...getFilterArgumentsOnFields(entityMetadata, fields));
	}

	const permissionsFromInputArgs = args?.items
		? generatePermissionListFromArgs()(gqlEntityTypeName, args.items, accessType)
		: [];

	const permissionsFromFilterArgs = args?.filter
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
		const { entityName, accessType, type, field } = permission;

		if (type === RequirePermissionType.ENTITY) {
			const acl = getACL(entityName);

			if (!acl || Object.keys(acl).length === 0) {
				logger.error(
					`The entity ${entityName} does not have an ACL defined. Please define an ACL for this entity.`
				);
				throw new Error(GENERIC_AUTH_ERROR_MESSAGE);
			}

			try {
				await assertUserCanPerformRequestedAction(acl, accessType);
			} catch (e) {
				logger.error(`User does not have permission to ${accessType} the ${entityName} entity`, e);
				throw e;
			}
		} else if (type === RequirePermissionType.FIELD && field) {
			assertUserHasAccessToField({
				field,
				entityName,
				context,
				accessType,
			});
		} else {
			throw new Error('Unrecognized permission type, unable to apply permissions.');
		}
	}
};

const generatePermissionListFromFields = <G>(
	entityMetadata: EntityMetadata<G>,
	requestedFields: ResolveTree
) => {
	const permissionsList: RequiredPermission[] = [];

	if (Object.keys(requestedFields.fieldsByTypeName).length > 0) {
		// If at least one field is requested, do they have permission to read the entity?
		permissionsList.push({
			entityName: entityMetadata.name,
			accessType: AccessType.Read,
			type: RequirePermissionType.ENTITY,
		});
	}

	for (const [entityName, fields] of Object.entries(requestedFields.fieldsByTypeName)) {
		if (entityName === graphweaverMetadata.federationNameForGraphQLTypeName('AggregationResult')) {
			// We just need to record that they're trying to read the entity information via an aggregation and move on.
			permissionsList.push({
				entityName: entityMetadata.name,
				accessType: AccessType.Read,
				type: RequirePermissionType.ENTITY,
			});
		} else {
			for (const fieldValue of Object.values(fields)) {
				let fieldMetadata = entityMetadata.fields[fieldValue.name];

				if (!fieldMetadata && fieldValue.name.endsWith('_aggregate')) {
					// It's an aggregate operation, we need to treat it as a relationship anyway. Let's strip the
					// `_aggregate` off and try another lookup.
					fieldMetadata = entityMetadata.fields[fieldValue.name.replace(aggregatePattern, '')];
				}

				if (!fieldMetadata) {
					// If we're down here and can't figure out what the field is then we should throw an error
					logger.error(
						requestedFields,
						`Could not determine field metadata for field: '${fieldValue.name}' on ${entityMetadata.name} entity`
					);

					throw new Error(
						`Could not determine field metadata for field: '${fieldValue.name}' on ${entityMetadata.name} entity`
					);
				}

				const fieldType = fieldMetadata.getType();
				const fieldTypeMetadata = graphweaverMetadata.metadataForType(fieldType);
				if (isEntityMetadata(fieldTypeMetadata)) {
					permissionsList.push(...generatePermissionListFromFields(fieldTypeMetadata, fieldValue));
				} else {
					permissionsList.push({
						entityName: entityMetadata.name,
						field: {
							name: fieldValue.name,
							location: FieldLocation.FIELD,
						},
						accessType: AccessType.Read,
						type: RequirePermissionType.FIELD,
					});
				}
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
		permissionsList.push({
			entityName: entityMetadata.name,
			accessType: AccessType.Read,
			type: RequirePermissionType.ENTITY,
		});

		for (const [filterKey, value] of Object.entries(filter)) {
			const fieldMetadata = graphweaverMetadata.fieldMetadataForFilterKey(
				entityMetadata,
				filterKey
			);

			if (isTopLevelFilterProperty(filterKey)) {
				value.forEach((item) => {
					recurseThroughArg(entityMetadata, item);
				});
				continue;
			}

			if (!fieldMetadata) {
				throw new Error(
					`Could not determine field metadata for filter key: '${filterKey}' on ${entityMetadata.name} entity`
				);
			}
			
			const fieldType = fieldMetadata.getType();
			const fieldTypeMetadata = graphweaverMetadata.metadataForType(fieldType);
			if (isEntityMetadata(fieldTypeMetadata)) {
				recurseThroughArg(fieldTypeMetadata, value as Filter<unknown>);
			} else {
				permissionsList.push({
					entityName: entityMetadata.name,
					field: {
						name: filterKey,
						location: FieldLocation.NESTED_FILTER,
					},
					accessType: AccessType.Read,
					type: RequirePermissionType.FIELD,
				});
			}
		}
	};

	if (resolveTree.args.filter) {
		recurseThroughArg(entityMetadata, resolveTree.args.filter as Filter<unknown>);
	}

	for (const [entityName, fields] of Object.entries(resolveTree.fieldsByTypeName)) {
		if (entityName === graphweaverMetadata.federationNameForGraphQLTypeName('AggregationResult')) {
			// We just need to record that they're trying to read the entity information via an aggregation and move on.
			permissionsList.push({
				entityName: entityMetadata.name,
				accessType: AccessType.Read,
				type: RequirePermissionType.ENTITY,
			});
		} else {
			for (const fieldValue of Object.values(fields)) {
				let fieldMetadata = entityMetadata.fields[fieldValue.name];
				if (!fieldMetadata && fieldValue.name.endsWith('_aggregate')) {
					// It's an aggregate operation, we need to treat it as a relationship anyway. Let's strip the
					// `_aggregate` off and try another lookup.
					fieldMetadata = entityMetadata.fields[fieldValue.name.replace(aggregatePattern, '')];
				}

				if (!fieldMetadata) {
					// If we're down here and can't figure out what the field is then we should throw an error
					logger.error(
						resolveTree,
						`Could not determine field metadata for field: '${fieldValue.name}' on ${entityMetadata.name} entity`
					);

					throw new Error(
						`Could not determine field metadata for field: '${fieldValue.name}' on ${entityMetadata.name} entity`
					);
				}

				const fieldType = fieldMetadata.getType();
				const fieldTypeMetadata = graphweaverMetadata.metadataForType(fieldType);

				if (isEntityMetadata(fieldTypeMetadata)) {
					permissionsList.push(...getFilterArgumentsOnFields(fieldTypeMetadata, fieldValue));
				}
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
				permissionsList.push({
					entityName,
					accessType: AccessType.Read,
					type: RequirePermissionType.ENTITY,
				});
			} else {
				// We are an input argument so we need to check the access type
				switch (accessType) {
					case AccessType.Read:
						permissionsList.push({
							entityName,
							accessType: AccessType.Read,
							type: RequirePermissionType.ENTITY,
						});
						break;
					case AccessType.Create:
						permissionsList.push({
							entityName,
							accessType: AccessType.Create,
							type: RequirePermissionType.ENTITY,
						});
						break;
					case AccessType.Update:
						permissionsList.push({
							entityName,
							accessType: AccessType.Update,
							type: RequirePermissionType.ENTITY,
						});
						break;
					case AccessType.Delete:
						permissionsList.push({
							entityName,
							accessType: AccessType.Delete,
							type: RequirePermissionType.ENTITY,
						});
						break;
					default:
						throw new Error('Unrecognized access type, unable to apply permissions');
				}
			}

			// Now we have an array or an object lets see if its a related entity
			const entityFields = graphweaverMetadata.getEntityByName(entityName)?.fields;

			for (const [key, value] of Object.entries(node)) {
				// If we are here then we have an array or an object lets see if its a related entity
				let relationship = entityFields?.[key];

				if (!relationship && key.endsWith('_aggregate')) {
					// It's an aggregate operation, we need to treat it as a relationship anyway. Let's strip the
					// `_aggregate` off and try another lookup.
					relationship = entityFields?.[key.replace(aggregatePattern, '')];
				}

				const relatedEntityMetadata = graphweaverMetadata.metadataForType(relationship?.getType());

				if (isEntityMetadata(relatedEntityMetadata)) {
					const relationshipNodes = Array.isArray(value) ? value : [value];

					// We need to loop through the relationship nodes and check the access type as it could be a mixture of read, create, update
					for (const relationshipNode of relationshipNodes) {
						// If the subject of the relationship is null, we can bail out from ACL checks
						if (relationshipNode === null) {
							continue;
						}

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
				} else {
					permissionsList.push({
						entityName,
						field: {
							name: key,
							location: filter ? FieldLocation.FILTER : FieldLocation.INPUT,
						},
						accessType: filter ? AccessType.Read : accessType,
						type: RequirePermissionType.FIELD,
					});
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
		// Check permissions for this entity based on the currently logged in user
		await assertUserCanPerformRequest(
			gqlEntityTypeName,
			params.fields,
			params.args,
			accessType,
			params.context
		);
		// Fetch the ACL for this entity
		const acl = getACL(gqlEntityTypeName);
		// Fetch the filter for the currently logged in user
		const accessFilter = await getAccessFilter(acl, accessType);
		// Check if the filter has values and then assert we are in a transaction
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

		// Check user has permission for each for each entity, recursing as we go.
		const authChecks = entities.map((entity, index) =>
			entity?.[primaryKeyField]
				? checkAuthorization(
						gqlEntityTypeName,
						typeof entity[primaryKeyField] === 'number'
							? Number(entity[primaryKeyField])
							: String(entity[primaryKeyField]),
						items[index],
						accessType,
						params.transactional
					)
				: undefined
		);
		await Promise.all(authChecks);
		return params;
	};
};

export const beforeRead = (gqlEntityTypeName: string) => {
	return async <G>(params: ReadHookParams<G, AuthorizationContext>) => {
		// Check permissions for this entity based on the currently logged in user
		await assertUserCanPerformRequest(
			gqlEntityTypeName,
			params.fields,
			params.args,
			AccessType.Read,
			params.context
		);
		// Fetch the ACL for this entity
		const acl = getACL(gqlEntityTypeName);
		// Combine the access filter with the original filter
		const accessFilter = await getAccessFilter(acl, AccessType.Read);
		const consolidatedFilter = andFilters(params.args?.filter, accessFilter);

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
			AccessType.Delete,
			params.context
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
