import { ExcludeFromFilterType, ReadOnlyProperty, getMetadataStorage } from '@exogee/graphweaver';
import { IStorageProvider } from '../storageProvider';
import { findType } from 'type-graphql/dist/helpers/findType';
import { ImageScalar, MediaScalar } from '@exogee/graphweaver-scalars';

export enum MediaTypes {
	IMAGE = 'Image',
	VIDEO = 'Video',
}

type DownloadUrlFieldOptions = {
	storageProvider: IStorageProvider;
	key: string;
	mediaType: MediaTypes;
};

export function DownloadUrlField({
	storageProvider,
	key,
	mediaType,
}: DownloadUrlFieldOptions): PropertyDecorator {
	return function (target: any, propertyKey: string | symbol) {
		if (typeof propertyKey === 'symbol') {
			throw new Error(`@DownloadUrlField decorator key must be a string.`);
		}

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
		const prototype = target.constructor.prototype;

		metadata.collectClassFieldMetadata({
			name: propertyKey,
			schemaName: propertyKey,
			getType,
			typeOptions,
			complexity: undefined,
			target: prototype.constructor,
			description: undefined,
			deprecationReason: undefined,
			simple: undefined,
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
			target: prototype.constructor,
			complexity: undefined,
		});

		const fieldResolver = async (root: any) => {
			// Check that key is a property on the object
			if (!root[key]) {
				throw new Error(`@DownloadUrlField decorator key must be a key on the object.`);
			}
			return storageProvider.getDownloadUrl(root[key]);
		};

		Object.defineProperty(target, propertyKey, {
			enumerable: true,
			configurable: true,
			value: fieldResolver,
		});
	};
}
