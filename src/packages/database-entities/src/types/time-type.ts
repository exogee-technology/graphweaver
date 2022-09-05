import { EntityProperty, Platform, Type, ValidationError } from '@mikro-orm/core';

const TimePattern = /^\d{2}:\d{2}:\d{2}$/;

export class Time {
	constructor(public readonly hour = 0, public readonly minute = 0, public readonly second = 0) {
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

export class TimeType extends Type {
	convertToDatabaseValue(value: any, platform: Platform) {
		if (!value) return value;
		if (value instanceof Time) return value;

		throw ValidationError.invalidType(TimeType, value, 'JS');
	}

	convertToJSValue(value: any, platform: Platform) {
		if (!value) return value;

		if (typeof value === 'string' && TimePattern.test(value)) {
			const [hour, minute, second] = value.split(':');
			return new Time(+hour, +minute, +second);
		}

		throw ValidationError.invalidType(TimeType, value, 'database');
	}

	getColumnType(prop: EntityProperty, platform: Platform) {
		return 'time';
	}

	toJSON(value: any, platform: Platform) {
		if (!value) return value;
		if (value instanceof Time) return Time.toString();
		throw ValidationError.invalidType(TimeType, value, 'JS');
	}
}
