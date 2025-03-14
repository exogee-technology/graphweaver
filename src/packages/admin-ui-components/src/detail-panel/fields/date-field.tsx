import { Field, FieldProps } from 'formik';
import { DatePicker } from '../../date-picker';
import { useDataTransform } from '../use-data-transform';
import { AdminUIFilterType, EntityField } from '../../utils';
import { DateTime } from 'luxon';
import { dateTimeFieldTypes } from '../../filters';

interface Props {
	field: EntityField;
	filterType: AdminUIFilterType.DATE_TIME_RANGE | AdminUIFilterType.DATE_RANGE;
	fieldType: string;
}

export const DateField = (props: Props) => {
	const { field, filterType, fieldType } = props;

	// Before we go up to the server we need to change over to a string from a Luxon date.
	useDataTransform({
		field,
		transform: async (value: unknown) => {
			const withTime =
				filterType === AdminUIFilterType.DATE_TIME_RANGE || dateTimeFieldTypes.has(fieldType);
			if (!value || !DateTime.isDateTime(value)) return undefined;

			return withTime ? value.toISO() : value.toISODate();
		},
	});

	return (
		<Field name={field.name}>
			{({ field, form }: FieldProps) => (
				<div style={{ position: 'relative' }}>
					<DatePicker
						onChange={(startDate) => form.setFieldValue(field.name, startDate)}
						isRangePicker={false}
						startDate={field.value}
						filterType={filterType}
						fieldType={fieldType}
					/>
				</div>
			)}
		</Field>
	);
};
