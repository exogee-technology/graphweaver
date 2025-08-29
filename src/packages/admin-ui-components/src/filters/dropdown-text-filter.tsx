import { useApolloClient } from '@apollo/client';

import {
	ComboBox,
	DataFetchOptions,
	Filter,
	SelectMode,
	SelectOption,
	useSchema,
	substringFilterForFields,
} from '..';
import { getFilterOptionsQuery } from './graphql';
import { toSelectOption } from './utils';
import { useCallback } from 'react';

export interface DropdownTextFilterProps {
	fieldName: string;
	entity: string;
	onChange?: (fieldName: string, newFilter: Filter) => void;
	filter?: Filter;
}

const PAGE_SIZE = 100;

export const DropdownTextFilter = ({
	fieldName,
	entity,
	onChange,
	filter,
}: DropdownTextFilterProps) => {
	const { entityByName } = useSchema();
	const apolloClient = useApolloClient();
	const entityType = entityByName(entity);
	const field = entityType?.fields.find((f) => f.name === fieldName);
	if (!field) return null;

	const currentFilterValue = (filter?.[`${fieldName}_in`] as string[]) ?? [];

	const handleOnChange = (options?: SelectOption[]) => {
		const hasSelectedOptions = (options ?? [])?.length > 0;
		onChange?.(
			fieldName,
			hasSelectedOptions ? { [`${fieldName}_in`]: options?.map((option) => option.value) } : {}
		);
	};

	const dataFetcher = useCallback(
		async ({ page, searchTerm }: DataFetchOptions) => {
			const query = getFilterOptionsQuery(entityType, fieldName);

			const orderByForQuery = { [fieldName]: 'ASC' };

			const searchFilter = searchTerm ? substringFilterForFields([field], searchTerm) : undefined;

			const { data } = await apolloClient.query<{ result: any[] }>({
				query,
				variables: {
					filter: searchFilter || {},
					pagination: {
						orderBy: orderByForQuery,
						limit: PAGE_SIZE,
						offset: Math.max(0, (page - 1) * PAGE_SIZE),
					},
				},
			});

			return data.result.map((item: any) => ({
				label: item[fieldName] || 'notfound',
				value: item[entityType.primaryKeyField],
			}));
		},
		[apolloClient, entityType, fieldName, field]
	);

	return (
		<ComboBox
			key={fieldName}
			value={currentFilterValue.map(toSelectOption)}
			placeholder={fieldName}
			onChange={handleOnChange}
			allowFreeTyping={!!field.filter?.options?.substringMatch}
			mode={SelectMode.MULTI}
			data-testid={`${fieldName}-filter`}
			dataFetcher={dataFetcher}
		/>
	);
};
