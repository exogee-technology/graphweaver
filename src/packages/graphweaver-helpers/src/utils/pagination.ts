import type { PaginationOptions } from '@exogee/graphweaver';

export const createPaginationOptions = ({
	orderBy,
	offset,
	limit,
}: Partial<PaginationOptions> = {}) => {
	return {
		...(limit ? { count: limit } : {}),
		...(offset ? { offset } : {}),
	};
};
