import pluralize from 'pluralize';
import { getMetadataStorage } from 'type-graphql';

import { TypeMap } from '../common/types';

export const Filter = <T extends { name: string }>(GraphqlEntityType: () => T) => {
	return ({ constructor: target }: any, methodName: string, index: number) => {
		const gqlEntityType = GraphqlEntityType();
		const plural = pluralize(gqlEntityType.name);
		const typeMap = TypeMap[`${plural}FilterInput`];
		const metadata = getMetadataStorage();
		metadata.collectHandlerParamMetadata({
			kind: 'arg',
			name: 'filter',
			description: 'Filter the returned results',
			target,
			getType: () => {
				return typeMap;
			},
			methodName,
			index,
			typeOptions: { nullable: true },
			validate: undefined,
			deprecationReason: undefined,
		});
	};
};
