import { MetadataHookParams } from '@exogee/graphweaver-apollo';
import { AuthorizationContext, ForbiddenError } from '@exogee/graphweaver-auth';
import { Roles } from '..';

export const beforeRead = async (params: MetadataHookParams<AuthorizationContext>) => {
	// Ensure only logged in users can access the admin ui metadata
	if (!params.context.token) throw new ForbiddenError('Forbidden');
};

export const afterRead = async (params: MetadataHookParams<AuthorizationContext>) => {
	// Ensure only logged in users can access the admin ui metadata
	if (!params.context.token) throw new ForbiddenError('Forbidden');
	// console.log('afterRead');

	// console.log(params.metadata);
	const requestedFieldNames = params.metadata?.entities
		.find((entity) => entity.name === 'Task')
		?.fields.map((field) => field.name);

	console.log('requestedFields', requestedFieldNames);
	const entityName = 'Task';
	const preventedColumn = 'priority';

	// Determine user role from context
	if (
		params.context.user?.roles.includes(Roles.LIGHT_SIDE) &&
		requestedFieldNames.includes(preventedColumn)
	) {
		console.log(params.metadata?.entities);
		console.log('*******************\n');

		console.log(params.metadata?.entities?.find((entity) => entity.name === entityName));
		console.log('*******************\n');

		// filter out the prevented column from within the entityName entity
		const filteredEntities = params.metadata?.entities?.map((entity) => {
			if (entity.name === entityName) {
				const filteredFields = entity.fields.filter((field) => field.name !== preventedColumn);
				return {
					...entity,
					fields: filteredFields,
				};
			}
			return entity;
		});

		console.log('filteredEntities', filteredEntities);
		console.log({
			...params,
			metadata: {
				...params.metadata,
				entities: filteredEntities,
			},
		});

		return {
			...params,
			metadata: {
				...params.metadata,
				entities: filteredEntities,
			},
		};
	}
	return params;
};
