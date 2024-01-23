import 'reflect-metadata';
import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import {
	S3StorageProvider,
	StorageType,
	DownloadUrlField,
	MediaTypes,
} from '@exogee/graphweaver-storage-provider';
import { Entity, PrimaryKey, Property, BigIntType } from '@mikro-orm/core';
import {
	createBaseResolver,
	Field,
	GraphQLEntity,
	ID,
	ObjectType,
	ReadOnlyProperty,
	Resolver,
} from '@exogee/graphweaver';
import { BaseEntity, MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { Schema } from '@exogee/graphweaver-admin-ui-components';

/** Setup entities and resolvers  */
if (!process.env.AWS_S3_BUCKET) throw new Error('Missing required env AWS_S3_BUCKET');

@Entity()
export class OrmSubmission extends BaseEntity {
	@PrimaryKey({ type: BigIntType })
	id!: string;

	@Property({ type: String })
	key!: string;
}

const s3 = new S3StorageProvider({
	bucketName: process.env.AWS_S3_BUCKET,
	region: process.env.AWS_REGION,
	type: StorageType.S3,
	expiresIn: 3600,
});

@ObjectType('Submission')
export class Submission extends GraphQLEntity<OrmSubmission> {
	public dataEntity!: OrmSubmission;

	@Field(() => ID)
	id!: string;

	@ReadOnlyProperty({ adminUI: true, backend: false })
	@Field(() => String, { nullable: true })
	mediaKey?: string;

	@ReadOnlyProperty({ adminUI: true, backend: false })
	@Field(() => String, { nullable: true })
	imageKey?: string;

	@DownloadUrlField({ storageProvider: s3, resourceId: 'imageKey', mediaType: MediaTypes.IMAGE })
	mediaDownloadUrl?: string;

	@DownloadUrlField({ storageProvider: s3, resourceId: 'mediaKey', mediaType: MediaTypes.VIDEO })
	imageDownloadUrl?: string;
}

export const pgConnection = {
	connectionManagerId: 'pg',
	mikroOrmConfig: {
		entities: [OrmSubmission],
		driver: PostgreSqlDriver,
		dbName: process.env.DB_NAME,
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		port: Number(process.env.DB_PORT),
	},
};

@Resolver((of) => OrmSubmission)
export class SubmissionResolver extends createBaseResolver<OrmSubmission, OrmSubmission>(
	OrmSubmission,
	new MikroBackendProvider(OrmSubmission, pgConnection)
) {}

test('Test the decorator @DownloadUrlField', async () => {
	const graphweaver = new Graphweaver({
		resolvers: [SubmissionResolver],
	});

	const response = await graphweaver.server.executeOperation({
		query: gql`
			{
				result: _graphweaver {
					entities {
						name
						backendId
						summaryField
						fields {
							name
							type
							relationshipType
							relatedEntity
							filter {
								type
								__typename
							}
							attributes {
								isReadOnly
								__typename
							}
							__typename
						}
						attributes {
							isReadOnly
							__typename
						}
						__typename
					}
					enums {
						name
						values {
							name
							value
							__typename
						}
						__typename
					}
					__typename
				}
			}
		`,
	});
	assert(response.body.kind === 'single');
	const result = response.body.singleResult.data?.result as unknown as Schema;

	console.log(JSON.stringify(result, null, 2));
});
