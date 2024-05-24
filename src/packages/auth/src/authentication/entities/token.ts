import { GraphQLEntity, BaseDataEntity, Entity, Field } from '@exogee/graphweaver';

export class AuthToken implements BaseDataEntity {
	id: string;
	authToken: string;

	constructor(authToken: string) {
		this.id = authToken;
		this.authToken = authToken;
	}

	isReference() {
		return false;
	}
	isCollection() {
		return false;
	}
}

@Entity('Token', {
	apiOptions: {
		excludeFromBuiltInOperations: true,
	},
})
export class Token extends GraphQLEntity<AuthToken> {
	public dataEntity!: AuthToken;

	@Field(() => String)
	authToken!: string;
}
