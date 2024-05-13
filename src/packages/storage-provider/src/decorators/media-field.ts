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

	@Field(() => String)
	filename!: string;

	@Field(() => String, { apiOptions: { excludeFromBuiltInWriteOperations: true } })
	url!: string;

	static serialize = ({ value }: { value: unknown }) => {
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

	static deserialize = async (_args: {
		value: unknown;
		parent: Source;
	}): Promise<{ filename: string; url: any } | null> => {
		// this is overridden by the @MediaField decorator
		throw new Error('MediaFieldEntity.deserialize not implemented');
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

		MediaFieldEntity.deserialize = async ({ value, parent }) => {
			if (options.storageProvider === undefined) throw new Error('Storage provider not set');

			const filename = value;
			if (!filename) return null;

			if (typeof filename !== 'string') throw new Error('Invalid value for MediaFieldEntity');
			return {
				filename,
				url: await options.storageProvider.getDownloadUrl(parent, { key: filename }),
			};
		};
	};
}
