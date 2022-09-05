import { GraphQLScalarType, Kind } from 'graphql';

const zeroPad = (value: number, width = 2) => value.toString().padStart(width, '0');
const formatDate = (date: Date) =>
	`${date.getFullYear()}-${zeroPad(date.getMonth() + 1)}-${zeroPad(date.getDate())}`;

export const DateScalar = new GraphQLScalarType({
	name: 'Date',
	description:
		'The concept of a date without a time and/or timezone, e.g. My birthday is January 1st, 1864 regardless of timezone.',
	serialize(value: unknown): string {
		// check the type of received value
		if (!(typeof value === 'string')) {
			throw new Error('DateScalar can only serialize string values');
		}

		return value.toString();
	},
	parseValue(value: unknown): string {
		// check the type of received value
		if (typeof value !== 'string') {
			throw new Error('DateScalar can only parse string values');
		}
		if (!/^\d{4}-\d{1,2}-\d{1,2}$/.test(value)) {
			throw new Error(`Unable to parse DateScalar '${value}'`);
		}
		return value;
	},
	parseLiteral(ast): string {
		// check the type of received value
		if (ast.kind !== Kind.STRING) {
			throw new Error('DateScalar can only parse string values');
		}
		return DateScalar.parseValue(ast.value);
	},
});
