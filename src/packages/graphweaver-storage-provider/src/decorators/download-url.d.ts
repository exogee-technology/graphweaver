import { IStorageProvider } from '../storageProvider';
type DownloadUrlFieldOptions = {
    storageProvider: IStorageProvider;
    key: string;
};
export declare function DownloadUrlField({ storageProvider, key, }: DownloadUrlFieldOptions): PropertyDecorator;
export {};
