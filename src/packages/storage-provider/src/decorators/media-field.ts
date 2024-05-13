import {
	BaseContext,
	BaseDataEntity,
	Entity,
	Field,
	FieldOptions,
	GraphQLEntity,
	GraphQLResolveInfo,
	graphweaverMetadata,
} from '@exogee/graphweaver';
import { S3StorageProvider } from '../storageProvider';
import { Source } from 'graphql';

export type Media = {
	filename: string;
	url?: string;
};

export enum MediaTypes {
	IMAGE = 'Image',
	OTHER = 'Other',
}

type MediaTypeFieldOptions = FieldOptions & {
	storageProvider: S3StorageProvider;
};

interface MediaDataEntity extends BaseDataEntity {
	filename: string;
	url: string;
}

@Entity('Media')
class MediaFieldEntity extends GraphQLEntity<MediaDataEntity> {
	public dataEntity!: MediaDataEntity;

	@Field(() => String)
	filename!: string;

	@Field(() => String, { apiOptions: { excludeFromBuiltInWriteOperations: true } })
	url!: string;

	static serialize = (value: unknown) => {
		if (
			value &&
			value !== null &&
			typeof value == 'object' &&
			'filename' in value &&
			typeof value.filename === 'string'
		)
			return value.filename;
		throw new Error('Invalid value for MediaFieldEntity');
	};
}

export function MediaField(options: MediaTypeFieldOptions): PropertyDecorator {
	return function (target: any, propertyKey: string | symbol) {
		if (typeof propertyKey === 'symbol') {
			throw new Error(`@DownloadUrlField decorator key must be a string.`);
		}

		graphweaverMetadata.collectFieldInformation({
			target,
			name: propertyKey,
			getType: () => MediaFieldEntity,
			adminUIOptions: {
				readonly: true,
			},
			nullable: true,
			excludeFromFilterType: true,
			...options,
		});

		const fieldResolver = async (
			source: Source & { dataEntity: Record<string, string> },
			args: unknown,
			context: BaseContext,
			info: GraphQLResolveInfo
		) => {
			return {
				filename: source.dataEntity[propertyKey],
				url: await options.storageProvider.getDownloadUrl(
					source,
					{ key: source.dataEntity[propertyKey] as string },
					context,
					info
				),
			};
		};

		Object.defineProperty(target, propertyKey, {
			enumerable: true,
			configurable: true,
			value: fieldResolver,
		});
	};
}
