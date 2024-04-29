import { BaseDataEntity } from '@exogee/graphweaver';

export interface ApiKeyStorage extends BaseDataEntity {
	id: string;
	key: string;
	secret?: string;
	revoked?: boolean;
	roles?: string[];
}
