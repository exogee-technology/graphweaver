import { Filter, ComboBox, SelectMode, SelectOption } from '..';
import { toSelectOption } from './utils';

export interface BooleanFilterProps {
	fieldName: string;
	entity: string; // Not used but added to conform to API
	onChange?: (fieldName: string, newFilter: Filter) => void;
	filter?: Filter;
}

const options = [toSelectOption(true), toSelectOption(false)];

export const BooleanFilter = ({ fieldName, onChange, filter }: BooleanFilterProps) => {
	const handleOnChange = (options: SelectOption[]) => {
		const hasSelectedOptions = (options ?? [])?.length > 0;
		onChange?.(fieldName, hasSelectedOptions ? { [fieldName]: Boolean(options?.[0]?.value) } : {});
	};

	return (
		<ComboBox
			key={fieldName}
			options={options}
			value={filter?.[fieldName] !== undefined ? [toSelectOption(filter[fieldName])] : []}
			placeholder={fieldName}
			onChange={handleOnChange}
			mode={SelectMode.SINGLE}
			data-testid={`${fieldName}-filter`}
		/>
	);
};
