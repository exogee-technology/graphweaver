import { GraphQLScalarType, Kind } from 'graphql';

export class Time {
	constructor(
		public readonly hour = 0,
		public readonly minute = 0,
		public readonly second = 0
	) {
		if (hour > 23 || hour < 0) throw new Error(`Invalid time '${hour}:${minute}:${second}`);
		if (minute > 59 || minute < 0) throw new Error(`Invalid time '${hour}:${minute}:${second}`);
		if (second > 59 || second < 0) throw new Error(`Invalid time '${hour}:${minute}:${second}`);
	}

	public toString() {
		return `${this.hour.toString().padStart(2, '0')}:${this.minute
			.toString()
			.padStart(2, '0')}:${this.second.toString().padStart(2, '0')}`;
	}
}

export const TimeScalar = new GraphQLScalarType({
	name: 'Time',
	description:
		'The concept of a time (24h) without a date and/or timezone, e.g. This should happen at 7AM regardless of timezone.',
	serialize(value: unknown): string {
		// check the type of received value
		if (!(value instanceof Time)) {
			throw new Error('TimeScalar can only serialize Time values');
		}

		return value.toString();
	},
	parseValue(value: unknown): Time {
		// check the type of received value
		if (typeof value !== 'string') {
			throw new Error('TimeScalar can only parse string values');
		}
		if (!/^\d{2}:\d{2}:\d{2}$/.test(value)) {
			throw new Error(`Unable to parse TimeScalar '${value}'`);
		}
		const [hour, minute, second] = value.split(':');
		return new Time(+hour, +minute, +second);
	},
	parseLiteral(ast): Time {
		// check the type of received value
		if (ast.kind !== Kind.STRING) {
			throw new Error('TimeScalar can only parse string values');
		}
		return TimeScalar.parseValue(ast.value);
	},
});
