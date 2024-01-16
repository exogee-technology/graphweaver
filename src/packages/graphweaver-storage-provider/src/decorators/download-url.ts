import { IStorageProvider } from '../storageProvider';

type DownloadUrlFieldOptions = {
	storageProvider: IStorageProvider;
	key: string;
};

export function DownloadUrlField({
	storageProvider,
	key,
}: DownloadUrlFieldOptions): PropertyDecorator {
	return function (target: any, propertyKey: string | symbol) {
		Object.defineProperty(target, propertyKey, {
			get: function () {
				// Check that key is a key on the object
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
