import { SortEntity } from './use-schema';

export const isNumeric = (item: unknown): boolean => {
	if (item === undefined || item === null) return false;
	if (typeof item === 'bigint' || typeof item === 'number') return true;
	if (typeof item === 'string') {
		return !isNaN(+item);
	}
	return false;
};

export const getOrderByQuery = ({
	primaryKeyField,
	sort,
	defaultSort,
}: {
	primaryKeyField?: string;
	sort?: SortEntity;
	defaultSort?: SortEntity;
}) => ({
	...(sort
		? Array.isArray(sort)
			? sort.reduce((acc, { field, direction }) => ({ ...acc, [field]: direction }), {})
			: sort
		: defaultSort
			? defaultSort
			: primaryKeyField
				? { [primaryKeyField]: 'ASC' }
				: {}),
});

export const unwrapGraphQLErrors = (error: any) => {
	let currentError = error;
	while (currentError.cause) {
		currentError = currentError.cause;
	}

	if (currentError.result?.errors?.length) {
		return currentError.result.errors.map((error: any) => error.message).join(', ');
	}

	return currentError.message;
};
