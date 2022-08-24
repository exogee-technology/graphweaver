import pluralize from 'pluralize';
import { getMetadataStorage } from 'type-graphql';

import { TypeMap } from '../common/types';

export const Pagination = <T extends { name: string }>(GraphqlEntityType: () => T) => {
	return ({ constructor: target }: any, methodName: string, index: number) => {
		const metadata = getMetadataStorage();
		metadata.collectHandlerParamMetadata({
			kind: 'arg',
			name: 'pagination',
			description: 'Paginate the returned results',
			target,
			getType: () => {
				const entityType = GraphqlEntityType();
				const objectMetadata = metadata.objectTypes.find(
					(objectMetadata) => objectMetadata.target === (entityType as any)
				);
				if (!objectMetadata) throw new Error(`Could not locate metadata for ${GraphqlEntityType}`);

				return TypeMap[`${pluralize(objectMetadata.name)}PaginationInput`];
			},
			methodName,
			index,
			typeOptions: { nullable: true },
			validate: undefined,
		});
	};
};