import { UnixNanoTimestamp } from '../../utils';

export const NanoTimestampCell = (value: any) => {
	const timestamp = UnixNanoTimestamp.fromString(value);
	return <span>{timestamp.toDate().toLocaleString()}</span>;
};
