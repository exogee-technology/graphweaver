import {
	BaseDataEntity,
	Entity,
	Field,
	FieldOptions,
	GraphQLEntity,
	graphweaverMetadata,
} from '@exogee/graphweaver';
import { S3StorageProvider } from '../storageProvider';
import { Source } from 'graphql';

export interface Media extends BaseDataEntity {
	filename: string;
	type: MediaType;
	url?: string;
}

export enum MediaType {
	IMAGE = 'Image',
	OTHER = 'Other',
}

graphweaverMetadata.collectEnumInformation({
	name: 'MediaType',
	target: MediaType,
});

type MediaTypeFieldOptions = FieldOptions & {
	storageProvider: S3StorageProvider;
};

const isMedia = (value: unknown): value is Media =>
	!!(
		value &&
		value !== null &&
		typeof value == 'object' &&
		'filename' in value &&
		typeof value.filename === 'string' &&
		'type' in value &&
		typeof value.type === 'string'
	);

@Entity('Media')
class MediaFieldEntity extends GraphQLEntity<Media> {
	public dataEntity!: Media;

	@Field(() => String)
	filename!: string;

	@Field(() => MediaType)
	type!: MediaType;

	@Field(() => String, { apiOptions: { excludeFromBuiltInWriteOperations: true } })
	url!: string;

	static serialize = ({ value }: { value: unknown }) => {
		if (isMedia(value)) {
			return JSON.stringify(
				{
					filename: value.filename,
					type: value.type,
				},
				null,
				2
			);
		}
		throw new Error(
			'Invalid Media input data provided. Please sent a filename and type when creating or updating media.'
		);
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
			if (!value) return null;

			if (options.storageProvider === undefined)
				throw new Error('Storage provider not set on media field.');

			if (value && typeof value === 'string') {
				try {
					value = JSON.parse(value);
				} catch (e) {
					throw new Error('Unable to deserialize Media value from data provider.');
				}
			}

			if (isMedia(value)) {
				return {
					filename: value.filename,
					type: value.type,
					url: await options.storageProvider.getDownloadUrl(parent, {
						key: value.filename,
					}),
				};
			}

			throw new Error('Unable to deserialize Media value from data provider.');
		};
	};
}
