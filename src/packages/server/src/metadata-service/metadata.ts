import { Field, ObjectType } from 'type-graphql';
import { AdminUiEntityMetadata } from './entity';
import { AdminUiEnumMetadata } from './enum';

@ObjectType('AdminUiMetadata')
export class AdminUiMetadata {
	@Field(() => [AdminUiEntityMetadata])
	entities() {
		return [];
	}

	@Field(() => [AdminUiEnumMetadata])
	enums() {
		return [];
	}
}
