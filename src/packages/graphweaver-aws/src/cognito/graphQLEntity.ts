import {
	Arg,
	Field,
	ID,
	ObjectType,
	Root,
	Resolver,
	Mutation,
	getMetadataStorage,
} from 'type-graphql';
import { BaseDataEntity, GraphQLEntity, ReadOnly, createBaseResolver } from '@exogee/graphweaver';

import { CognitoUserBackendEntity } from './backendEntity';

type DataEntity = any;
const metadata = getMetadataStorage();
@ObjectType('CognitoUser')
export class CognitoUser extends GraphQLEntity<CognitoUserBackendEntity> {
	// extends GraphQLEntity<CognitoUserBackendEntity>
	public declare dataEntity: CognitoUserBackendEntity;

	static fromBackendEntity<D extends BaseDataEntity, G extends GraphQLEntity<D>>(
		this: new (dataEntity: D) => G,
		dataEntity: D
	) {
		if (dataEntity === undefined || dataEntity === null) return null;
		const entity = new this(dataEntity);
		console.log('CognitoUser.fromBackendEntity', entity);
		metadata.fields
			.filter((field) => field.target === this)
			.forEach((field) => {
				const dataField = dataEntity?.[field.name as keyof D];

				if (
					typeof dataField !== 'undefined' &&
					!dataEntity.isCollection?.(field.name, dataField) &&
					!dataEntity.isReference?.(field.name, dataField) &&
					typeof (entity as any)[field.name] !== 'function'
				)
					(entity as any)[field.name] = dataField;
			});
		return entity;
	}

	@Field(() => ID)
	declare id: string;

	@ReadOnly()
	@Field(() => String)
	async username(@Root() dataEntity: DataEntity) {
		console.log('CognitoUser.username', dataEntity);
		return dataEntity.dataEntity.Username;
	}

	@Field(() => Boolean)
	async enabled(@Root() dataEntity: DataEntity) {
		return dataEntity.dataEntity.Enabled;
	}

	@ReadOnly()
	@Field(() => String, { nullable: true })
	async email(@Root() dataEntity: DataEntity) {
		console.log('CognitoUser.email', dataEntity.dataEntity.Attributes);
		return (
			dataEntity.dataEntity.Attributes.find(
				(attribute: { Name: string }) => attribute.Name === 'email'
			)?.Value ?? null
		);
	}

	@Field(() => String)
	async userStatus(@Root() dataEntity: DataEntity) {
		return dataEntity.dataEntity.UserStatus;
	}

	@Field(() => String)
	async groups(@Root() dataEntity: DataEntity) {
		return dataEntity.dataEntity.Groups?.join(',') ?? '';
	}

	@Field(() => String, { nullable: true })
	async attributes(@Root() dataEntity: DataEntity) {
		return JSON.stringify(dataEntity.dataEntity.Attributes);
	}
}
