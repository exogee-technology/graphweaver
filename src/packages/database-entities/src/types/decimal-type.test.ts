import { Decimal } from 'decimal.js';

import { Database } from '..';
import { DecimalType } from './decimal-type';

describe('DecimalType', () => {
	beforeAll(async () => {
		await Database.connect();
	});

	afterAll(async () => {
		await Database.close();
	});

	test('convertToDatabaseValue', () => {
		const type = new DecimalType();
		const platform = Database.em.getDriver().getPlatform();
		expect(type.convertToDatabaseValue(new Decimal(10), platform)).toBe('10.0000');
		expect(type.convertToDatabaseValue(null, platform)).toBe(null);
		expect(type.convertToDatabaseValue(undefined, platform)).toBe(undefined);
		expect(() => type.convertToDatabaseValue(new Decimal(1).dividedBy(0), platform)).toThrowError();
		expect(() => type.convertToDatabaseValue(new Decimal(NaN), platform)).toThrowError();
		expect(() => type.convertToDatabaseValue(new Date(), platform)).toThrowError();
	});

	test('convertToJSValue', () => {
		const type = new DecimalType();
		const platform = Database.em.getDriver().getPlatform();
		expect(type.convertToJSValue('20.2394', platform)).toStrictEqual(new Decimal(20.2394));
		expect(type.convertToJSValue(null, platform)).toBe(null);
		expect(type.convertToJSValue(undefined, platform)).toBe(undefined);
		expect(() => type.convertToJSValue(1 / 0, platform)).toThrowError();
		expect(() => type.convertToJSValue('asd', platform)).toThrowError();
	});

	test('getColumnType', () => {
		const type1 = new DecimalType();
		const platform = Database.em.getDriver().getPlatform();
		expect(type1.getColumnType({ columnType: 'foo' } as any, platform)).toBe('numeric(12, 4)');

		const type2 = new DecimalType(9, 6);
		expect(type2.getColumnType({ columnType: 'foo' } as any, platform)).toBe('numeric(9, 6)');
		expect(type2.convertToDatabaseValue(new Decimal(10), platform)).toBe('10.000000');
	});

	test('toJSON', () => {
		const type = new DecimalType();
		const platform = Database.em.getDriver().getPlatform();
		expect(type.toJSON(new Decimal(20.2394), platform)).toBe(20.2394);
		expect(type.toJSON(null, platform)).toBe(null);
		expect(type.toJSON(undefined, platform)).toBe(undefined);
		expect(() => type.toJSON(new Decimal(1).dividedBy(0), platform)).toThrowError();
		expect(() => type.toJSON(new Decimal(NaN), platform)).toThrowError();
		expect(() => type.toJSON('asd', platform)).toThrowError();
	});
});
