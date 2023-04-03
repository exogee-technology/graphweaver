import { GraphQLScalarType, Kind } from 'graphql';
import { DateTime } from 'luxon';

export const ISODateStringScalar = new GraphQLScalarType({
	name: 'ISOString',
	description:
		'Returns a string in simplified extended ISO format (ISO 8601), which is always 24 or 27 characters long (YYYY-MM-DDTHH:mm:ss.sssZ or ±YYYYYY-MM-DDTHH:mm:ss.sssZ, respectively). The timezone is always zero UTC offset, as denoted by the suffix "Z".',
	serialize(value: unknown): string {
		// check the type of received value
		if (!(value instanceof Date) && typeof value !== 'string') {
			throw new Error('ISODateStringScalar can only serialize string or Date values');
		}

		return value instanceof Date ? value.toISOString() : value.toString();
	},
	parseValue(value: unknown): string {
		// check the type of received value
		if (typeof value !== 'string') {
			throw new Error('ISODateStringScalar can only parse string values');
		}

		const date = DateTime.fromISO(value);
		if (!date.isValid) {
			throw new Error(`Unable to parse ISODateStringScalar '${value}'`);
		}
		return value;
	},
	parseLiteral(ast): string {
		// check the type of received value
		if (ast.kind !== Kind.STRING) {
			throw new Error('ISODateStringScalar can only parse string values');
		}
		return ISODateStringScalar.parseValue(ast.value);
	},
});
