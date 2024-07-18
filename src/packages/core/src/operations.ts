export const arrayOperations = new Set(['in', 'nin']);
export const basicOperations = new Set(['ne', 'notnull', 'null']);
export const likeOperations = new Set(['like', 'ilike']);
export const mathOperations = new Set(['gt', 'gte', 'lt', 'lte']);
export const allOperations = new Set([
	...arrayOperations,
	...basicOperations,
	...likeOperations,
	...mathOperations,
]);
