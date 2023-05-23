import { GraphQLEntity, SummaryField, BaseDataEntity } from '@exogee/graphweaver';
import { Field, ID, ObjectType } from 'type-graphql';

export class AuthToken implements BaseDataEntity {
	authToken: string;

	constructor(authToken: string) {
		this.authToken = authToken;
	}

	isReference() {
		return false;
	}
	isCollection() {
		return false;
	}
}

@ObjectType('Token')
export class Token extends GraphQLEntity<AuthToken> {
	public dataEntity!: AuthToken;

	@Field(() => String)
	authToken!: string;
}
