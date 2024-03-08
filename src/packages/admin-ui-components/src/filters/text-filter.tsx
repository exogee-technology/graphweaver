import { useLazyQuery } from '@apollo/client';

import { Filter, ComboBox, SelectMode, SelectOption, useSchema } from '..';
import { queryForFilterText } from './graphql';

export interface TextFilterProps {
	fieldName: string;
	entity: string;
	onChange?: (fieldName: string, filter?: Filter) => void;
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

	const [getData, { loading, error, data }] = useLazyQuery<{ result: Record<string, string>[] }>(
		queryForFilterText(entity, fieldName, entityByName)
	);

	const textOptions = new Set<string>((data?.result || []).map((value) => value?.[fieldName]));

	const handleOnChange = (options?: SelectOption[]) => {
		onChange?.(
			fieldName,
			(options ?? [])?.length > 1
				? // if there are multiple options, use the _in filter
				  {
						[`${fieldName}_in`]: options?.map((option) => option.value),
				  }
				: // if there is only one option, use the equals filter
				options?.length === 1
				? ({ [fieldName]: options?.[0]?.value } as Filter<string>)
				: undefined
		);
	};

	const handleOnOpen = () => {
		if (!data && !loading && !error) {
			getData();
		}
	};

	return (
		<ComboBox
			key={`${fieldName}:${resetCount}`}
			options={[...textOptions].map((value) => ({ value, label: value }))}
			value={initialValue ? [{ value: initialValue, label: initialValue }] : []}
			placeholder={fieldName}
			onChange={handleOnChange}
			onOpen={handleOnOpen}
			loading={loading}
			mode={SelectMode.MULTI}
		/>
	);
};
