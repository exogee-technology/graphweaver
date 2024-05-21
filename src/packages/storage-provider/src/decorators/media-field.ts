import {
	BaseDataEntity,
	Entity,
	Field,
	FieldOptions,
	GraphQLEntity,
	graphweaverMetadata,
	FieldMetadata,
	Source,
} from '@exogee/graphweaver';
import { S3StorageProvider } from '../storageProvider';

export interface MediaData extends BaseDataEntity {
	filename: string;
	type: MediaType;
	url?: string;
}

export enum MediaType {
	IMAGE = 'IMAGE',
	OTHER = 'OTHER',
}

graphweaverMetadata.collectEnumInformation({
	name: 'MediaType',
	target: MediaType,
});

type MediaTypeFieldOptions = FieldOptions & {
	storageProvider: S3StorageProvider;
};

const isMedia = (value: unknown): value is MediaData =>
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
export class Media extends GraphQLEntity<MediaData> {
	public dataEntity!: MediaData;

	@Field(() => String)
	filename!: string;

	@Field(() => MediaType)
	type!: MediaType;

	@Field(() => String, { apiOptions: { excludeFromBuiltInWriteOperations: true } })
	url!: string;

	static serialize = ({ value }: { value: unknown }) => {
		if (value === null) return null;
		if (isMedia(value)) {
			return JSON.stringify({
				filename: value.filename,
				type: value.type,
			});
		}
		throw new Error(
			'Invalid Media input data provided. Please sent a filename and type when creating or updating media.'
		);
	};

	static deserialize = async ({
		value,
		parent,
		fieldMetadata,
	}: {
		value: unknown;
		parent: Source;
		fieldMetadata: FieldMetadata<any, any>;
	}) => {
		if (!value) return null;

		if (!fieldMetadata.additionalInformation?.MediaFieldStorageProvider)
			throw new Error('Storage provider not set on media field.');

		if (value && typeof value === 'string') {
			try {
				value = JSON.parse(value);
			} catch (e) {
				throw new Error('Unable to deserialize Media value from data provider.');
			}
		}

		if (isMedia(value)) {
			const storageProvider = fieldMetadata.additionalInformation
				.MediaFieldStorageProvider as S3StorageProvider;

			return {
				filename: value.filename,
				type: value.type,
				url: await storageProvider.getDownloadUrl(parent, {
					key: value.filename,
				}),
			};
		}

		throw new Error('Unable to deserialize Media value from data provider.');
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
			getType: () => Media,
			adminUIOptions: {
				readonly: true,
			},
			nullable: true,
			excludeFromFilterType: true,
			additionalInformation: {
				MediaFieldStorageProvider: options.storageProvider,
			},
			...options,
		});
	};
}
