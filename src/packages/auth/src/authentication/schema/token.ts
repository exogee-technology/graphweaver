import { GraphQLEntity, SummaryField, BaseDataEntity } from '@exogee/graphweaver';
import { Field, ID, ObjectType } from 'type-graphql';

export class AuthToken implements BaseDataEntity {
	authToken: string;
	refreshToken!: string;

	constructor(authToken: string, refreshToken: string) {
		this.authToken = authToken;
		this.refreshToken = refreshToken;
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

	@Field(() => String)
	refreshToken!: string;
}
