import {
	BaseDataEntity,
	CreateOrUpdateHookParams,
	DeleteHookParams,
	GraphQLEntity,
	GraphQLEntityConstructor,
	GraphQLArgs,
	ReadHookParams,
	getMetadataStorage,
	BaseFilterInputArgs,
	BaseInsertInputArgs,
	BaseInsertManyInputArgs,
	BaseUpdateInputArgs,
	BaseUpdateManyInputArgs,
	BaseOrderByInputArgs,
	BasePaginationInputArgs,
	BaseCreateOrUpdateManyInputArgs,
	BaseDeleteInputArgs,
	BaseListInputFilterArgs,
} from '@exogee/graphweaver';
import { logger } from '@exogee/logger';
import { GraphQLResolveInfo, SelectionSetNode } from 'graphql';

import { AccessType, AuthorizationContext } from '../../types';
import { andFilters } from '../../helper-functions';
import {
	GENERIC_AUTH_ERROR_MESSAGE,
	assertUserCanPerformRequestedAction,
	checkAuthorization,
	getACL,
	getAccessFilter,
} from '../../auth-utils';

const metadata = getMetadataStorage();
const isPopulatedFilter = (filter: any): boolean => Object.keys(filter).length > 0;

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
const assertUserCanPerformRequest = <G>(
	gqlEntityTypeName: string,
	info: GraphQLResolveInfo,
	args: GraphQLArgs<G>
) => {
	for (const nodes of info.fieldNodes) {
		const permissionsFromFields = generatePermissionListFromFields()(
			gqlEntityTypeName,
			nodes.selectionSet
		);
		const permissionsFromItemsArgs = args.items
			? generatePermissionListFromArgs()(gqlEntityTypeName, args.items)
			: [];
		const permissionsFromFilterArgs = args.filter
			? generatePermissionListFromArgs()(gqlEntityTypeName, [args.filter])
			: [];

		const permissionsList = new Set([
			...permissionsFromFields,
			...permissionsFromItemsArgs,
			...permissionsFromFilterArgs,
		]);

		// Check the permissions
		for (const permission of permissionsList) {
			const [entityName, action] = permission.split(':');
			const acl = getACL(entityName);
			assertUserCanPerformRequestedAction(acl, action as AccessType);
		}
	}
};

const generatePermissionListFromFields = () => {
	const permissionsList = new Set<RequiredPermission>();

	const recurseThroughFields = (entityName: string, selectionSet: SelectionSetNode | undefined) => {
		permissionsList.add(`${entityName}:${AccessType.Read}`);
		const entityFields = metadata.fields.filter((field) => field.target.name === entityName);

		for (const node of selectionSet?.selections ?? []) {
			// Check if the field has a selection set of its own which infers this node is an entity
			if (node.kind === 'Field' && node.selectionSet) {
				const field = entityFields.find((field) => field.name === node.name.value);
				const fieldType = field?.getType() as GraphQLEntityConstructor<
					GraphQLEntity<BaseDataEntity>,
					BaseDataEntity
				>;

				const isRelationshipField = fieldType && fieldType?.prototype instanceof GraphQLEntity;
				if (isRelationshipField) {
					// Let's check the user has permission to read the related entity
					recurseThroughFields(fieldType.name, node.selectionSet);
				}
			}
		}

		return permissionsList;
	};

	return recurseThroughFields;
};

const generatePermissionListFromArgs = <G>() => {
	const permissionsList = new Set<RequiredPermission>();

	const recurseThroughArgs = (entityName: string, argumentNode: Partial<G>[]) => {
		for (const node of argumentNode) {
			const prototype = node?.constructor?.prototype;
			switch (true) {
				case prototype instanceof BaseListInputFilterArgs:
					permissionsList.add(`${entityName}:${AccessType.Read}`);
					break;
				case prototype instanceof BaseFilterInputArgs:
					permissionsList.add(`${entityName}:${AccessType.Read}`);
					break;
				case prototype instanceof BaseInsertInputArgs:
					permissionsList.add(`${entityName}:${AccessType.Create}`);
					break;
				case prototype instanceof BaseUpdateInputArgs:
					permissionsList.add(`${entityName}:${AccessType.Update}`);
					break;
				case prototype instanceof BaseDeleteInputArgs:
					permissionsList.add(`${entityName}:${AccessType.Delete}`);
					break;
				default:
					throw new Error('Unknown Base Input Arg.');
			}

			// Now we have an array or an object lets see if its a related entity
			const entries = Object.entries(node);
			for (const [key, value] of entries) {
				// If we are here then we have an array or an object lets see if its a related entity
				const relationship = metadata.fields.find((field) => field.name === key);
				const relatedEntity = relationship?.getType() as GraphQLEntityConstructor<
					GraphQLEntity<BaseDataEntity>,
					BaseDataEntity
				>;
				const isRelatedEntity = relatedEntity && relatedEntity.prototype instanceof GraphQLEntity;
				if (isRelatedEntity) {
					// Let's check the user has permission to read the related entity
					recurseThroughArgs(relatedEntity.name, Array.isArray(value) ? value : [value]);
				}
			}
		}
		return permissionsList;
	};

	return recurseThroughArgs;
};

export const beforeCreateOrUpdate = (gqlEntityTypeName: string) => {
	return async <G>(params: CreateOrUpdateHookParams<G, AuthorizationContext>) => {
		// 1. Check permissions for this entity based on the currently logged in user
		assertUserCanPerformRequest(gqlEntityTypeName, params.info, params.args);
		// 2. Fetch the ACL for this entity
		const acl = getACL(gqlEntityTypeName);
		// 3. Fetch the filter for the currently logged in user
		const accessFilter = await getAccessFilter(acl, AccessType.Create);
		// 4. Check if the filter has values and then assert we are in a transaction
		// You can only use a filter in this way when you are in a transaction
		if (isPopulatedFilter(accessFilter)) assertTransactional(params.transactional);

		return params;
	};
};

export const afterCreateOrUpdate = async <G>(
	params: CreateOrUpdateHookParams<G, AuthorizationContext>
) => {
	const items = params.args.items;
	const entities = (params.entities ?? []) as GraphQLEntity<BaseDataEntity>[];

	// 1. Check to ensure we are within a transaction
	assertTransactional(params.transactional);
	// 2. Check user has permission for each
	// @todo what if the order returned is not the same as the input?
	const authChecks = entities.map((entity, index) =>
		entity?.id
			? checkAuthorization(
					Object.getPrototypeOf(entity).constructor,
					entity.id,
					items[index],
					AccessType.Create
			  )
			: undefined
	);
	await Promise.all(authChecks);
	return params;
};

export const beforeRead = (gqlEntityTypeName: string) => {
	return async <G>(params: ReadHookParams<G, AuthorizationContext>) => {
		// 1. Check permissions for this entity based on the currently logged in user
		assertUserCanPerformRequest(gqlEntityTypeName, params.info, params.args);
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
		assertUserCanPerformRequest(gqlEntityTypeName, params.info, params.args);
		// 2. Fetch the ACL for this entity
		const acl = getACL(gqlEntityTypeName);
		// 3. Combine the access filter with the original filter
		const accessFilter = await getAccessFilter(acl, AccessType.Delete);
		const consolidatedFilter = andFilters(params.args.filter, accessFilter);

		// @todo test delete many

		return {
			...params,
			args: {
				...params.args,
				filter: consolidatedFilter,
			},
		};
	};
};
