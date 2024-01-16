import { getMetadataStorage } from '@exogee/graphweaver';
import { IStorageProvider } from '../storageProvider';
import { findType } from 'type-graphql/dist/helpers/findType';

export enum MediaType {
	IMAGE = 'Image',
	VIDEO = 'Video',
}

type DownloadUrlFieldOptions = {
	storageProvider: IStorageProvider;
	key: string;
	mediaType: MediaType;
};

export function DownloadUrlField({
	storageProvider,
	key,
	mediaType,
}: DownloadUrlFieldOptions): PropertyDecorator {
	return function (target: any, propertyKey: string | symbol) {
		// if propertyKey is a symbol, throw an error
		if (typeof propertyKey === 'symbol') {
			throw new Error(`@DownloadUrlField decorator key must be a string.`);
		}
		console.log('target', target);

		const { getType, typeOptions } = findType({
			metadataKey: 'design:returntype',
			prototype: target,
			propertyKey,
			returnTypeFunc: () => String,
			typeOptions: { nullable: true },
		});

		const prototype = target.constructor.prototype;

		const options = {
			name: mediaType,
			description: undefined,
			complexity: undefined,
			deprecationReason: undefined,
			simple: undefined,
		};

		getMetadataStorage().collectClassFieldMetadata({
			name: propertyKey,
			schemaName: options.name || propertyKey,
			getType,
			typeOptions,
			complexity: options.complexity,
			target: prototype.constructor,
			description: options.description,
			deprecationReason: options.deprecationReason,
			simple: options.simple,
		});
		Object.defineProperty(target, propertyKey, {
			get: function () {
				// Check that key is a property on the object
				if (!target[key]) {
					throw new Error(`@DownloadUrlField decorator key must be a key on the object.`);
				}
				return storageProvider.getDownloadUrl(target[key]);
			},
			enumerable: true,
			configurable: true,
		});
	};
}
