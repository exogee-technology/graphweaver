import {
	BaseDataEntity,
	Field,
	GraphQLEntity,
	ID,
	ObjectType,
	ReadOnly,
	SummaryField,
} from '@exogee/graphweaver';

export interface PasswordStorage {
	id: string;
	username: string;
	password?: string;
}

@ReadOnly()
@ObjectType('Credential')
export class Credential<D extends BaseDataEntity> extends GraphQLEntity<D> {
	public dataEntity!: D;

	@Field(() => ID)
	id!: string;

	@SummaryField()
	@Field(() => String)
	username!: string;
}
