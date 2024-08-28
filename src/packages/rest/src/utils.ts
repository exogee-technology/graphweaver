import { EntityMetadata } from '@exogee/graphweaver';
import { logger } from '@exogee/logger';
import escapeStringRegexp from 'escape-string-regexp';

const operatorFunctionMap = {
	// Array Operations
	in: (fieldValue: any, testValue: any[]) => new Set(testValue).has(fieldValue),
	nin: (fieldValue: any, testValue: any[]) => !operatorFunctionMap.in(fieldValue, testValue),

	// Equality Operations
	ne: (fieldValue: any, testValue: any) => fieldValue !== testValue,
	notnull: (fieldValue: any) => fieldValue !== null && fieldValue !== undefined,
	null: (fieldValue: any) => fieldValue === null || fieldValue === undefined,

	// Math Operations
	gt: (fieldValue: any, testValue: any) =>
		typeof fieldValue == typeof testValue && fieldValue > testValue,
	gte: (fieldValue: any, testValue: any) =>
		typeof fieldValue == typeof testValue && fieldValue >= testValue,
	lt: (fieldValue: any, testValue: any) =>
		typeof fieldValue == typeof testValue && fieldValue < testValue,
	lte: (fieldValue: any, testValue: any) =>
		typeof fieldValue == typeof testValue && fieldValue <= testValue,

	// String Operations
	like: (fieldValue: any, testValue: string) => new RegExp(likeToRegex(testValue)).test(fieldValue),
	ilike: (fieldValue: any, testValue: string) =>
		new RegExp(likeToRegex(testValue), 'i').test(fieldValue),
};

const likeToRegex = (likeString: string) =>
	`^${escapeStringRegexp(likeString).replaceAll('%', '.*').replaceAll('_', '.')}$`;

// Generator function, which returns a function that can filter an array based on the Graphweaver filter
// passed in. This will not scale infinitely, but works in many cases. For other cases, you may need to
// implement server side filtering within the REST API, or sync the data to a database.
export const inMemoryFilterFor =
	(entityMetadata: EntityMetadata, filter: Record<string, any>) => (item: any) => {
		for (const [filterKey, filterValue] of Object.entries(filter || {})) {
			if (filterKey === '_or') {
				for (const condition of filterValue) {
					if (inMemoryFilterFor(entityMetadata, condition)(item)) return true;
				}
				return false;
			} else if (filterKey === '_and') {
				for (const condition of filterValue) {
					if (!inMemoryFilterFor(entityMetadata, condition)(item)) return false;
				}
				return true;
			} else if (!entityMetadata.fields[filterKey] && filterKey.indexOf('_') >= 0) {
				// This is an operator. Let's see which one.
				const chunks = filterKey.split('_');
				const operator = chunks.pop() as keyof typeof operatorFunctionMap | undefined;
				if (!operator) {
					throw new Error(
						'Did not get an operator after testing that we would definitely get an operator. This should not happen.'
					);
				}
				if (!operatorFunctionMap[operator]) {
					throw new Error(`'${operator}' operator is not implemented for in memory filtering.`);
				}

				const field = chunks.join('_');
				if (!entityMetadata.fields[field]) {
					throw new Error(`Field ${field} does not exist on entity. Not sure how to filter.`);
				}

				const result = operatorFunctionMap[operator](item[field], filterValue);

				logger.trace(
					{ operator, field, fieldValue: item[field], result },
					'Rest Adapter: In memory filter operation'
				);

				if (!result) return false;
			} else {
				if (
					item[filterKey] === null ||
					item[filterKey] === undefined ||
					item[filterKey] !== filterValue
				) {
					return false;
				}
			}
		}

		return true;
	};
