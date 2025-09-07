import { Field, FieldProps } from 'formik';
import { useDataTransform } from '..';
import { ComboBox, SelectMode, SelectOption } from '../../combo-box';
import { EntityField } from '../../utils';

export const BooleanField = ({
	field,
	autoFocus,
	disabled = false,
}: {
	field: EntityField;
	autoFocus: boolean;
	disabled?: boolean;
}) => {
	useDataTransform({
		field,
		transform: async (value: unknown) => {
			if (!value || !Array.isArray(value)) return undefined;

			return value[0]?.value;
		},
	});
	
	return (
		<Field name={field.name}>
			{({ field, form }: FieldProps) => (
				<ComboBox
					options={[
						{ value: true, label: 'true' },
						{ value: false, label: 'false' },
					]}
					value={field.value}
					onChange={(selected: SelectOption[]) => form.setFieldValue(field.name, selected)}
					mode={SelectMode.SINGLE}
					disabled={disabled}
					autoFocus={autoFocus}
				/>
			)}
		</Field>
	);
};
