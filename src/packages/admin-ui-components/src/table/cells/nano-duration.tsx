import { UnixNanoTimestamp } from '../../utils';

export const NanoDurationCell = (value: any) => {
	const duration = UnixNanoTimestamp.fromString(value);
	const { value: displayValue, unit } = duration.toSIUnits();
	return (
		<span>
			{Number(displayValue).toFixed(2)} {unit}
		</span>
	);
};
