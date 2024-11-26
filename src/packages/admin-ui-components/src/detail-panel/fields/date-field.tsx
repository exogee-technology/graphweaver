import { Field, FieldProps } from 'formik';
import { DatePicker } from '../../date-picker';
import { useDataTransform } from '../use-data-transform';
import { EntityField } from '../../utils';
import { DateTime } from 'luxon';

export const DateField = ({ field }: { field: EntityField }) => {
	// Before we go up to the server we need to change over to a string from a Luxon date.
	useDataTransform({
		field,
		transform: async (value: unknown) => {
			if (!value || !DateTime.isDateTime(value)) return undefined;

			return value.toISODate();
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
					/>
				</div>
			)}
		</Field>
	);
};
