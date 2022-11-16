import { EntityProperty, Platform, Type, ValidationError } from '@mikro-orm/core';

const DatePattern = /^\d{4}-\d{1,2}-\d{1,2}$/;

export class DateType extends Type {
	convertToDatabaseValue(value: any, platform: Platform) {
		if (!value) return value;

		if (typeof value === 'string') {
			const [date] = value.split('T');
			const [year, month, day] = date.split('-');
			return new Date(`${year}-${month}-${day}T00:00:00Z`);
		}

		throw ValidationError.invalidType(DateType, value, 'JS');
	}

	convertToJSValue(value: any, platform: Platform) {
		if (!value) return value;

		if (typeof value === 'string' && DatePattern.test(value)) {
			return value;
		}

		throw ValidationError.invalidType(DateType, value, 'database');
	}

	getColumnType(prop: EntityProperty, platform: Platform) {
		return 'date';
	}

	toJSON(value: any, platform: Platform) {
		if (!value) return value;
		if (value instanceof Date) {
			return `${value.getFullYear()}-${value.getMonth() + 1}-${value.getDate()}`;
		} else if (typeof value === 'string') {
			return value;
		}
		throw ValidationError.invalidType(DateType, value, 'JS');
	}
}
