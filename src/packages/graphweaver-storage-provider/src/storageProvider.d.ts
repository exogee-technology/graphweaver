export declare enum StorageType {
    S3 = "s3"
}
type StorageConfig = {
    type: StorageType;
    bucketName: string;
    region?: string;
    expiresIn?: number;
};
export interface IStorageProvider {
    getDownloadUrl(key: string): Promise<string>;
}
export interface IStorageResolver {
    getUploadUrl(key: string): Promise<string>;
}
export declare class S3StorageResolver {
    private config;
    bucketName: string;
    region: string | undefined;
    expiresIn: number;
    constructor(config: StorageConfig);
    getUploadUrl(key: string): Promise<string>;
}
export declare class S3StorageProvider {
    private config;
    bucketName: string;
    region: string | undefined;
    expiresIn: number;
    constructor(config: StorageConfig);
    getDownloadUrl(key: string): Promise<string>;
}
export {};
