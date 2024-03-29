import { ExcludeFromFilterType, ReadOnlyProperty, getMetadataStorage } from '@exogee/graphweaver';
import { IStorageProvider } from '../storageProvider';
import { findType } from 'type-graphql/dist/helpers/findType';
import { ImageScalar, MediaScalar } from '@exogee/graphweaver-scalars';

export enum MediaTypes {
	IMAGE = 'Image',
	OTHER = 'Other',
}

type DownloadUrlFieldOptions = {
	storageProvider: IStorageProvider;
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

		ExcludeFromFilterType()(target, propertyKey);
		ReadOnlyProperty()(target, propertyKey);

		const metadata = getMetadataStorage();

		const { typeOptions } = findType({
			metadataKey: 'design:returntype',
			prototype: target,
			propertyKey,
			returnTypeFunc: () => String,
			typeOptions: { nullable: true },
		});

		const getType = () => {
			switch (mediaType) {
				case MediaTypes.IMAGE:
					return ImageScalar;
				default:
					return MediaScalar;
			}
		};

		metadata.collectClassFieldMetadata({
			name: propertyKey,
			schemaName: propertyKey,
			getType,
			typeOptions,
			complexity: undefined,
			target: target.constructor,
			description: undefined,
			deprecationReason: undefined,
			simple: undefined,
		});

		metadata.collectExtensionsFieldMetadata({
			target: target.constructor,
			fieldName: propertyKey,
			extensions: { key: resourceId },
		});

		metadata.collectHandlerParamMetadata({
			kind: 'root',
			target: target.constructor,
			methodName: propertyKey,
			index: 0,
			propertyName: undefined,
			getType,
		});

		metadata.collectFieldResolverMetadata({
			kind: 'internal',
			methodName: propertyKey,
			schemaName: propertyKey,
			target: target.constructor,
			complexity: undefined,
		});

		const fieldResolver = async (root: any) => {
			// If the key is set to null, we don't want to return a download url, an return empty string
			if (root[resourceId] === null) return '';

			// Check that key is a property on the object
			if (!root[resourceId]) {
				throw new Error(`@DownloadUrlField decorator key must be a key on the object.`);
			}
			return storageProvider.getDownloadUrl(root[resourceId]);
		};

		Object.defineProperty(target, propertyKey, {
			enumerable: true,
			configurable: true,
			value: fieldResolver,
		});
	};
}
