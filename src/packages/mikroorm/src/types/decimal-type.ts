import { EntityProperty, Platform, Type, ValidationError } from '@mikro-orm/core';
import { Decimal } from 'decimal.js';

export class DecimalType extends Type {
	constructor(
		private readonly precision = 12,
		private readonly scale = 4
	) {
		super();
	}

	convertToDatabaseValue(value: any, platform: Platform) {
		if (value == null) return value;
		if (value instanceof Decimal) {
			if (value.isNaN()) throw new Error('Decimal should not be NaN');
			if (!value.isFinite()) throw new Error('Decimal should be finite');
			return value.toFixed(this.scale);
		}
		throw ValidationError.invalidType(DecimalType, value, 'JS');
	}

	convertToJSValue(value: any, platform: Platform) {
		if (value == null) return value;
		const decimal = new Decimal(value);

		if (!decimal.isFinite()) throw new Error('Decimal should be finite');

		return decimal;
	}

	getColumnType(prop: EntityProperty, platform: Platform) {
		return `numeric(${this.precision}, ${this.scale})`;
	}

	toJSON(value: any, platform: Platform) {
		if (value === null || typeof value === 'undefined') return value;
		if (value instanceof Decimal) {
			if (value.isNaN()) throw new Error('Decimal should not be NaN');
			if (!value.isFinite()) throw new Error('Decimal should be finite');
			return value.toNumber();
		}
		throw ValidationError.invalidType(DecimalType, value, 'JS');
	}
}
