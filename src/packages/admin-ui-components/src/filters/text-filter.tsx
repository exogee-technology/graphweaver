import { useQuery } from '@apollo/client';

import { Filter, Select, SelectOption, useSchema } from '..';
import { queryForFilterText } from './graphql';

export interface TextFilterProps {
	fieldName: string;
	entity: string;
	onChange?: (fieldName: string, filter?: Filter<string>) => void;
	initialFilter?: Filter<string>;
	resetCount: number; // We use this to reset the filter using the key
}

export const TextFilter = ({
	fieldName,
	entity,
	onChange,
	initialFilter,
	resetCount,
}: TextFilterProps) => {
	const { entityByName } = useSchema();
	const initialValue = initialFilter?.[fieldName];

	const { data } = useQuery<{ result: Record<string, string>[] }>(
		queryForFilterText(entity, fieldName, entityByName)
	);

	const textOptions = new Set<string>((data?.result || []).map((value) => value?.[fieldName]));

	const handleOnChange = (options?: SelectOption[]) => {
		onChange?.(
			fieldName,
			(options ?? [])?.length > 0
				? // @todo this can be expanded to support the in operator { [`${fieldName}_in`]: options?.map((option) => option.value) }
				  ({ [fieldName]: options?.[0]?.value } as Filter<string>)
				: undefined
		);
	};

	return (
		<Select
			key={fieldName + resetCount}
			options={[...textOptions].map((value) => ({ value, label: value }))}
			value={initialValue ? [{ value: initialValue, label: initialValue }] : []}
			placeholder={fieldName}
			onChange={handleOnChange}
		/>
	);
};
