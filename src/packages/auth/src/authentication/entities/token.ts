import { Entity, Field } from '@exogee/graphweaver';

export class AuthToken {
	constructor(public readonly authToken: string) {
		this.authToken = authToken;
	}
}

@Entity('Token', {
	apiOptions: {
		excludeFromBuiltInOperations: true,
	},
})
export class Token {
	@Field(() => String, { primaryKeyField: true })
	authToken!: string;
}
