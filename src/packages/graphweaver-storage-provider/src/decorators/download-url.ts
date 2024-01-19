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
	key?: string;
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
		if (!key) return '';

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

		// To avoid "update and create do a step that remove values.downloadUrl and we set key"
		// Put the name of the key
		// 1. get info from typegql metadatastore
		// 2. EntityTypeMap
		// 3. Create my own metadatastore
		// Figure out how to get this into the _graphweaver query
		// This map will sit outside of core

		// Could have metadata query from storage

		// 1. Change to readonly decorator - by default readonly in BE and adminUI
		//	Can pass in flags to change this - key is reaonly from adminui
		// 2. DownloadURL dont want to send to backend, - downloadurl is readonly from the backend
		//  readonly from the backend
		//

		// take steves decorator code changes
		// keep as key - add todo to change to be configure
		// Understand ExtensionsMetadata, passing in key. Consequences???
		// Put extensions into _graphweaver

		metadata.collectClassFieldMetadata({
			name: propertyKey,
			schemaName: propertyKey,
			getType,
			typeOptions,
			complexity: undefined,
			target: target.constructor, // prototype.constructor,
			description: `${key}`,
			deprecationReason: undefined,
			simple: undefined,
		});

		metadata.collectExtensionsFieldMetadata({
			target: target.constructor,
			fieldName: propertyKey,
			extensions: { key },
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
			target: target.constructor, //prototype.constructor,
			complexity: undefined,
		});

		const fieldResolver = async (root: any) => {
			// If the key is set to null, we don't want to return a download url, an return empty string
			if (root[key] === null) return '';

			// Check that key is a property on the object
			if (!root[key]) {
				console.log('root', root);
				console.log('key', key);
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
