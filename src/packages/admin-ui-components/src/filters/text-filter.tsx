import { useLazyQuery } from '@apollo/client';

import { Filter, ComboBox, SelectMode, SelectOption, useSchema } from '..';
import { queryForFilterText } from './graphql';
import toast from 'react-hot-toast';

export interface TextFilterProps {
	fieldName: string;
	entity: string;
	onChange?: (fieldName: string, newFilter: Filter) => void;
	initialFilter?: Filter | undefined;
	resetCount: number; // We use this to reset the filter using the key
}

export const TextFilter = ({
	fieldName,
	entity,
	onChange,
	initialFilter,
	resetCount,
}: TextFilterProps) => {
	const initialValue = (
		initialFilter?.[fieldName] ? [initialFilter?.[fieldName]] : initialFilter?.[`${fieldName}_in`]
	) as string[] | undefined;
	const { entityByName } = useSchema();

	const [getData, { loading, error, data }] = useLazyQuery<{
		result: Record<string, string>[];
	}>(queryForFilterText(entityByName(entity), fieldName));

	const textOptions = new Set<string>((data?.result || []).map((value) => value?.[fieldName]));

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

	return (
		<ComboBox
			key={`${fieldName}:${resetCount}`}
			options={[...textOptions].map((value) => ({ value, label: value }))}
			value={initialValue ? initialValue.map((value) => ({ value, label: undefined })) : []}
			placeholder={fieldName}
			onChange={handleOnChange}
			onOpen={handleOnOpen}
			loading={loading}
			mode={SelectMode.MULTI}
		/>
	);
};
