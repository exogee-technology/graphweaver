import { BaseContext, GraphQLResolveInfo, graphweaverMetadata } from '@exogee/graphweaver';
import { S3StorageProvider } from '../storageProvider';
import { ImageScalar, MediaScalar } from '@exogee/graphweaver-scalars';
import { Source } from 'graphql';

export enum MediaTypes {
	IMAGE = 'Image',
	OTHER = 'Other',
}

type DownloadUrlFieldOptions = {
	storageProvider: S3StorageProvider;
	resourceId?: string;
	mediaType: MediaTypes;
};

export function MediaField({
	storageProvider,
	resourceId,
	mediaType,
}: DownloadUrlFieldOptions): PropertyDecorator {
	return function (target: any, propertyKey: string | symbol) {
		if (typeof propertyKey === 'symbol') {
			throw new Error(`@DownloadUrlField decorator key must be a string.`);
		}
		if (!resourceId) return '';

		graphweaverMetadata.collectFieldInformation({
			target,
			name: propertyKey,
			getType: () => {
				switch (mediaType) {
					case MediaTypes.IMAGE:
						return ImageScalar;
					default:
						return MediaScalar;
				}
			},
			adminUIOptions: {
				readonly: true,
			},
			nullable: true,
			excludeFromFilterType: true,
		});

		// const metadata = getMetadataStorage();

		// const getType = () => {};

		// metadata.collectClassFieldMetadata({
		// 	name: propertyKey,
		// 	schemaName: propertyKey,
		// 	getType,
		// 	typeOptions,
		// 	complexity: undefined,
		// 	target: target.constructor,
		// 	description: undefined,
		// 	deprecationReason: undefined,
		// 	simple: undefined,
		// });

		// metadata.collectExtensionsFieldMetadata({
		// 	target: target.constructor,
		// 	fieldName: propertyKey,
		// 	extensions: { key: resourceId },
		// });

		// metadata.collectHandlerParamMetadata({
		// 	kind: 'root',
		// 	target: target.constructor,
		// 	methodName: propertyKey,
		// 	index: 0,
		// 	propertyName: undefined,
		// 	getType,
		// });

		// metadata.collectFieldResolverMetadata({
		// 	kind: 'internal',
		// 	methodName: propertyKey,
		// 	schemaName: propertyKey,
		// 	target: target.constructor,
		// 	complexity: undefined,
		// });

		const fieldResolver = async (
			source: Source,
			args: unknown,
			context: BaseContext,
			info: GraphQLResolveInfo
		) => {
			// If the key is set to null, we don't want to return a download url, an return empty string
			if (source[resourceId as keyof Source] === null) return '';

			// Check that key is a property on the object
			if (!source[resourceId as keyof Source]) {
				throw new Error(`@DownloadUrlField decorator key must be a key on the object.`);
			}
			return storageProvider.getDownloadUrl(
				source,
				{ key: source[resourceId as keyof Source] as string },
				context,
				info
			);
		};

		// Object.defineProperty(target, propertyKey, {
		// 	enumerable: true,
		// 	configurable: true,
		// 	value: fieldResolver,
		// });
	};
}
