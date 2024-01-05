import { MetadataHookParams } from '@exogee/graphweaver-server';
import { AuthorizationContext, ForbiddenError } from '@exogee/graphweaver-auth';
import { Roles } from './roles';

export const beforeRead = async <C extends AuthorizationContext>(params: MetadataHookParams<C>) => {
	// Ensure only logged in users can access the admin ui metadata
	if (!params.context.token) throw new ForbiddenError('Forbidden');
	return params;
};

export const afterRead = async <C extends AuthorizationContext>(params: MetadataHookParams<C>) => {
	// Ensure only logged in users can access the admin ui metadata
	if (!params.context.token) throw new ForbiddenError('Forbidden');

	// Filter out the priority column from the Task entity if the user is on the light side
	const requestedFieldNames = params.metadata?.entities
		.find((entity) => entity.name === 'Task')
		?.fields.map((field) => field.name);
	const entityName = 'Task';
	const preventedColumn = 'priority';

	if (
		params.context.user?.roles.includes(Roles.LIGHT_SIDE) &&
		requestedFieldNames.includes(preventedColumn)
	) {
		// Filter out the prevented column from within the specificed entity
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
