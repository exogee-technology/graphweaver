import { registerScalarType } from '@exogee/base-resolver';
import { DateScalar } from '@exogee/graphql-scalars';
import { Field, ObjectType, registerEnumType } from 'type-graphql';

// We want our Date Scalars to be treated by BaseResolver as if they're standard Date fields.
registerScalarType(DateScalar, Date);

// Common Enums

// Common GraphQL objects
@ObjectType()
export class FileStoreSignedUrl {
	@Field(() => String)
	url!: string;

	@Field(() => String)
	path!: string;
}
