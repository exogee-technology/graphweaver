import { DateTime } from 'luxon';
import { useId } from 'react';
import styles from './styles.module.css';

interface Props {
	value: DateTime | undefined;
	setValue: (value: DateTime) => void;
	defaultTime: string;
	label?: string
}

const timeFormat = 'HH:mm:ss';

export const TimeInput = (props: Props) => {
	const { value, setValue, defaultTime, label } = props;
	const id = useId();
	return (
		<>
			{label && <label htmlFor={id}>
				{label}
			</label>}
			<input
				id={id} 
				type="time"
				step={1}
				value={value?.toFormat(timeFormat) ?? defaultTime}
				onChange={(event) => {
					if (!event.target.value) return;
					const newDate = DateTime.fromISO(event.target.value);
					setValue(
						(value ?? DateTime.now()).set({
							hour: newDate.hour,
							minute: newDate.minute,
							second: newDate.second,
						})
					);
				}}
			/>
		</>
	);
};
