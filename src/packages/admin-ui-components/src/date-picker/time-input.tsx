import { DateTime } from 'luxon';

interface Props {
	value: DateTime | undefined;
	setValue: (value: DateTime) => void;
	defaultTime: string;
}

const timeFormat = 'HH:mm:ss';

export const TimeInput = (props: Props) => {
	const { value, setValue, defaultTime } = props;
	return (
		<input
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
	);
};
