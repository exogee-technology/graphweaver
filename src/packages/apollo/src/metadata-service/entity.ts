import { Field, ObjectType } from 'type-graphql';
import { AdminUiFieldMetadata } from './field';

@ObjectType('AdminUiEntityMetadata')
export class AdminUiEntityMetadata {
	@Field(() => String)
	name!: string;

	@Field(() => String, { nullable: true })
	backendId?: string | null;

	@Field(() => [AdminUiFieldMetadata])
	fields?: AdminUiFieldMetadata[] = [];
}
