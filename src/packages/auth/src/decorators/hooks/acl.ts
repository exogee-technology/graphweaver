import {
	BaseDataEntity,
	CreateOrUpdateHookParams,
	DeleteHookParams,
	GraphQLEntity,
	GraphQLEntityConstructor,
	GraphQLArgs,
	ReadHookParams,
	// BaseFilterInputArgs,
	// BaseInsertInputArgs,
	// BaseUpdateInputArgs,
	// BaseDeleteInputArgs,
	// BaseListInputFilterArgs,
	// BaseGetOneInputArgs,
	graphweaverMetadata,
} from '@exogee/graphweaver';
import { logger } from '@exogee/logger';
import { GraphQLResolveInfo, Kind, SelectionSetNode, ValueNode } from 'graphql';

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

const getAccessTypeForArg = (node: unknown): AccessType => {
	// If we have an object with only an id then we are reading
	if (
		typeof node === 'object' &&
		node !== null &&
		Object.keys(node).length === 1 &&
		Object.prototype.hasOwnProperty.call(node, 'id')
	) {
		return AccessType.Read;
	}

	// If we have an object with a id and other fields then we are updating
	if (
		typeof node === 'object' &&
		node !== null &&
		Object.keys(node).length > 1 &&
		Object.prototype.hasOwnProperty.call(node, 'id')
	) {
		return AccessType.Update;
	}

	// If we have an object with no id then we are creating
	if (
		typeof node === 'object' &&
		node !== null &&
		!Object.prototype.hasOwnProperty.call(node, 'id')
	) {
		return AccessType.Create;
	}

	throw new Error('Unrecognized node access type, unable to apply permissions');
};

const isRelatedEntity = (
	entity: any
): entity is GraphQLEntityConstructor<GraphQLEntity<BaseDataEntity>, BaseDataEntity> => {
	return !!(entity && entity.prototype instanceof GraphQLEntity);
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
	info: GraphQLResolveInfo,
	args: GraphQLArgs<G>,
	accessType: AccessType
) => {
	const selectionSets = info.fieldNodes
		.filter((node) => node.selectionSet)
		.flatMap((node) => node.selectionSet);

	const permissionsFromFields = new Set(
		...selectionSets.map((selectionSet) =>
			generatePermissionListFromFields(info.fragments)(gqlEntityTypeName, selectionSet)
		)
	);

	const permissionsFromInputArgs = args.items
		? generatePermissionListFromArgs()(gqlEntityTypeName, args.items, accessType)
		: [];

	const permissionsFromFilterArgs = args.filter
		? generatePermissionListFromArgs()(gqlEntityTypeName, [args.filter], accessType, true)
		: [];

	const permissionsFromFilterArgsOnFields = new Set(
		...selectionSets.map((selectionSet) => {
			// Get the filter arguments on the fields for this selection set
			const filterArgs = getFilterArgumentsOnFields()(gqlEntityTypeName, selectionSet);
			return generatePermissionListFromArgumentsOnFields()(filterArgs);
		})
	);

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

const generatePermissionListFromFields = (fragments: GraphQLResolveInfo['fragments']) => {
	const permissionsList = new Set<RequiredPermission>();

	const recurseThroughFields = (entityName: string, selectionSet: SelectionSetNode | undefined) => {
		permissionsList.add(`${entityName}:${AccessType.Read}`);
		const entityFields = metadata.getEntityByName(entityName)?.fields;

		for (const node of selectionSet?.selections ?? []) {
			// Check if the field has a selection set of its own which infers this node is an entity
			if (node.kind === 'Field' && node.selectionSet) {
				const field = entityFields?.[node.name.value];
				const fieldType = field?.getType() as GraphQLEntityConstructor<
					GraphQLEntity<BaseDataEntity>,
					BaseDataEntity
				>;

				const isRelationshipField = fieldType && fieldType?.prototype instanceof GraphQLEntity;
				if (isRelationshipField) {
					// Let's check the user has permission to read the related entity
					recurseThroughFields(fieldType.name, node.selectionSet);
				}
			} else if (node.kind === 'FragmentSpread') {
				const fragment = fragments[node.name.value];
				recurseThroughFields(entityName, fragment.selectionSet);
			} else if (node.kind === 'InlineFragment') {
				recurseThroughFields(entityName, node.selectionSet);
			}
		}

		return permissionsList;
	};

	return recurseThroughFields;
};

// Returns a function that walks through the selection set and checks each relationship field to see if it contains a filter argument
const getFilterArgumentsOnFields = () => {
	const argumentsList = new Map<string, ValueNode>();

	const recurseThroughFields = (entityName: string, selectionSet: SelectionSetNode | undefined) => {
		const entityFields = metadata.getEntityByName(entityName)?.fields;

		for (const node of selectionSet?.selections ?? []) {
			if (node.kind === 'Field' && node.arguments?.length && node.selectionSet) {
				const field = entityFields?.[node.name.value];
				const fieldType = field?.getType() as GraphQLEntityConstructor<
					GraphQLEntity<BaseDataEntity>,
					BaseDataEntity
				>;
				const isRelationshipField = fieldType && fieldType?.prototype instanceof GraphQLEntity;
				if (isRelationshipField) {
					const filterArgument = node.arguments.find((arg) => arg.name.value === 'filter');
					if (filterArgument) {
						argumentsList.set(fieldType.name, filterArgument.value);
					}
					recurseThroughFields(fieldType.name, node.selectionSet);
				}
			}
		}
		return argumentsList;
	};
	return recurseThroughFields;
};

// Returns a function that walks through the filter arguments and checks each relationship field to see if it is an entity and if so, adds the required permission to the list
const generatePermissionListFromArgumentsOnFields = () => {
	const permissionsList = new Set<RequiredPermission>();

	const recurseThroughArgs = (argumentNode: Map<string, ValueNode>) => {
		for (const [entityName, node] of argumentNode) {
			const entityFields = metadata.getEntityByName(entityName)?.fields;
			permissionsList.add(`${entityName}:${AccessType.Read}`);

			if (node.kind === Kind.OBJECT && Array.isArray(node.fields)) {
				for (const field of node.fields) {
					if (field.kind === Kind.OBJECT_FIELD) {
						const relationship = entityFields?.[field.name.value];
						const relatedEntity = relationship?.getType() as GraphQLEntityConstructor<
							GraphQLEntity<BaseDataEntity>,
							BaseDataEntity
						>;
						const isRelatedEntity =
							relatedEntity && relatedEntity.prototype instanceof GraphQLEntity;
						if (isRelatedEntity) {
							// Let's check the user has permission to read the related entity
							recurseThroughArgs(new Map([[relatedEntity.name, field.value]]));
						}
					}
				}
			}
		}

		return permissionsList;
	};

	return recurseThroughArgs;
};

// Returns a function that walks through the input arguments and checks their type to see which type of operation is being performed and adds the required permission to the list
const generatePermissionListFromArgs = <G>() => {
	const permissionsList = new Set<RequiredPermission>();

	const recurseThroughArgs = (
		entityName: string,
		argumentNode: Partial<G>[],
		accessType: AccessType,
		filter: boolean = false
	) => {
		for (const node of argumentNode) {
			if (filter) {
				permissionsList.add(`${entityName}:${AccessType.Read}`);
			} else {
				// We are an input argument so we need to check the access type
				switch (accessType) {
					case AccessType.Read:
						permissionsList.add(`${entityName}:${AccessType.Read}`);
						break;
					case AccessType.Create:
						permissionsList.add(`${entityName}:${AccessType.Create}`);
						break;
					case AccessType.Update:
						permissionsList.add(`${entityName}:${AccessType.Update}`);
						break;
					case AccessType.Delete:
						permissionsList.add(`${entityName}:${AccessType.Delete}`);
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
				const relatedEntity = relationship?.getType();

				if (isRelatedEntity(relatedEntity)) {
					const relationshipNodes = Array.isArray(value) ? value : [value];

					// We need to loop through the relationship nodes and check the access type as it could be a mixture of read, create, update
					for (const relationshipNode of relationshipNodes) {
						// Check the access type of the relationship
						const relationshipAccessType = filter
							? accessType
							: getAccessTypeForArg(relationshipNode);

						// Let's check the user has permission to read the related entity
						recurseThroughArgs(
							relatedEntity.name,
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
		await assertUserCanPerformRequest(gqlEntityTypeName, params.info, params.args, accessType);
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
		const items = params.args.items;
		const entities = (params.entities ?? []) as GraphQLEntity<BaseDataEntity>[];

		// 1. Check to ensure we are within a transaction
		assertTransactional(params.transactional);
		// 2. Check user has permission for each for each entity
		const authChecks = entities.map((entity, index) =>
			entity?.id
				? checkAuthorization(gqlEntityTypeName, entity.id, items[index], accessType)
				: undefined
		);
		await Promise.all(authChecks);
		return params;
	};
};

export const beforeRead = (gqlEntityTypeName: string) => {
	return async <G>(params: ReadHookParams<G, AuthorizationContext>) => {
		// 1. Check permissions for this entity based on the currently logged in user
		await assertUserCanPerformRequest(gqlEntityTypeName, params.info, params.args, AccessType.Read);
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
			params.info,
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
