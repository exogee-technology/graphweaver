import { BooleanCell } from './boolean';
import { JsonCell } from './json';
import { MediaCell } from './media';
import { NanoDurationCell } from './nano-duration';
import { NanoTimestampCell } from './nano-timestamp';

export const cells = {
	JSON: JsonCell,
	Boolean: BooleanCell,
	NanoDuration: NanoDurationCell,
	NanoTimestamp: NanoTimestampCell,
	GraphweaverMedia: MediaCell,
};
