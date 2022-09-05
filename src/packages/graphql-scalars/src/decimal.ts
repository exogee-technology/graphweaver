import Decimal from 'decimal.js';
import { GraphQLScalarType, Kind } from 'graphql';

export const DecimalScalar = new GraphQLScalarType({
	name: 'Decimal',
	description: 'Decimal type often used to represent Money.',
	serialize(value: unknown): string {
		// check the type of received value
		if (!(value instanceof Decimal)) {
			throw new Error('DecimalScalar can only serialize Decimal values');
		}
		return value.toString(); // value sent to the client
	},
	parseValue(value: unknown): Decimal {
		// check the type of received value
		if (typeof value !== 'string') {
			throw new Error('DecimalScalar can only parse string values');
		}
		return new Decimal(value);
	},
	parseLiteral(ast): Decimal {
		// check the type of received value
		if (ast.kind !== Kind.STRING) {
			throw new Error('DecimalScalar can only parse string values');
		}
		return new Decimal(ast.value);
	},
});
