import {
	Field,
	ID,
	GraphQLEntity,
	ObjectType,
	SummaryField,
	registerEnumType,
} from '@exogee/graphweaver';
import { MemberDataEntity, MemberStatus } from '../../entities';

registerEnumType(MemberStatus, {
	name: 'MemberStatus',
});

@ObjectType()
export class Member extends GraphQLEntity<MemberDataEntity> {
	@Field(() => ID)
	id!: string;

	@SummaryField()
	@Field(() => String)
	email_address: string;

	@Field(() => MemberStatus)
	status!: MemberStatus;
}
