import pluralize from 'pluralize';
import { getMetadataStorage } from 'type-graphql';

import { TypeMap } from '../common/types';
import { EntityMetadataMap } from '../base-resolver';

export const ArgFilter = <T extends { name: string }>(GraphqlEntityType: () => T) => {
	const gqlEntityType = GraphqlEntityType();

	if (
		EntityMetadataMap.get(gqlEntityType.name)?.provider?.backendProviderConfig?.filter?.childByChild
	) {
		throw new Error("Data provider doesn't support childByChild filtering");
	}
	if (
		EntityMetadataMap.get(gqlEntityType.name)?.provider?.backendProviderConfig?.filter
			?.parentByChild
	) {
		throw new Error("Data provider doesn't support parentByChild filtering");
	}
	return ({ constructor: target }: any, methodName: string, index: number) => {
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
