import { createBaseResolver, Resolver } from '@exogee/graphweaver';
import { Category } from './entity';
import { ClientOptions } from '../index';
import { CategoryDataEntity } from '../../entities/category';
import { createCategoryProvider } from './provider';

export type CategoryResolver = ReturnType<typeof createCategoryResolver>;

export const createCategoryResolver = (mailchimpConfig: ClientOptions, listId: string) => {
	const provider = createCategoryProvider(mailchimpConfig, listId);

	@Resolver(() => Category)
	class CategoryResolver extends createBaseResolver<Category, CategoryDataEntity>(
		Category,
		provider
	) {}

	return CategoryResolver;
};
