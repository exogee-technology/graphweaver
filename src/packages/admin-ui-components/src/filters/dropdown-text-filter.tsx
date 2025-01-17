import { useLazyQuery } from '@apollo/client';

import { ComboBox, Filter, SelectMode, SelectOption, useSchema } from '..';
import { queryForFilterOptions } from './graphql';
import { toSelectOption } from './utils';

export interface DropdownTextFilterProps {
	fieldName: string;
	entity: string;
	onChange?: (fieldName: string, newFilter: Filter) => void;
	filter?: Filter;
}

export const DropdownTextFilter = ({
	fieldName,
	entity,
	onChange,
	filter,
}: DropdownTextFilterProps) => {
	const { entityByName } = useSchema();

	const [getData, { loading, error, data }] = useLazyQuery<{
		result: Record<string, string>[];
	}>(queryForFilterOptions(entityByName(entity), fieldName));

	const comboBoxOptions = new Set<string>((data?.result || []).map((value) => value?.[fieldName]));

	const handleOnChange = (options?: SelectOption[]) => {
		const hasSelectedOptions = (options ?? [])?.length > 0;
		onChange?.(
			fieldName,
			hasSelectedOptions ? { [`${fieldName}_in`]: options?.map((option) => option.value) } : {}
		);
	};

	const handleOnOpen = () => {
		if (!data && !loading && !error) {
			getData();
		}
	};

	const currentFilterValue = (filter?.[`${fieldName}_in`] as string[]) ?? [];

	return (
		<ComboBox
			key={fieldName}
			options={[...comboBoxOptions].map(toSelectOption)}
			value={currentFilterValue.map(toSelectOption)}
			placeholder={fieldName}
			onChange={handleOnChange}
			onOpen={handleOnOpen}
			loading={loading}
			mode={SelectMode.MULTI}
			data-testid={`${fieldName}-filter`}
		/>
	);
};
