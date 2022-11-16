import { Time } from '@exogee/graphweaver-mikroorm';
import { GraphQLScalarType, Kind } from 'graphql';

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
