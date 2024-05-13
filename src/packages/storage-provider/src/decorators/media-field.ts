import {
	BaseDataEntity,
	Entity,
	Field,
	FieldOptions,
	GraphQLEntity,
	graphweaverMetadata,
	BaseContext,
} from '@exogee/graphweaver';
import { S3StorageProvider } from '../storageProvider';
import { GraphQLArgument, GraphQLResolveInfo, Source } from 'graphql';

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
	public static storageProvider?: S3StorageProvider;
	public static propertyKey?: string;

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

	static deserialize = async (
		source: Source,
		_args: GraphQLArgument,
		context: BaseContext,
		info: GraphQLResolveInfo
	) => {
		if (MediaFieldEntity.storageProvider === undefined) throw new Error('Storage provider not set');
		if (MediaFieldEntity.propertyKey === undefined) throw new Error('Property key not set');

		const filename = source[MediaFieldEntity.propertyKey as keyof Source] as string | undefined;
		if (!filename) return null;
		return {
			filename,
			url: await MediaFieldEntity.storageProvider.getDownloadUrl(
				source,
				{ key: filename },
				context,
				info
			),
		};
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

		MediaFieldEntity.storageProvider = options.storageProvider;
		MediaFieldEntity.propertyKey = propertyKey;
	};
}
