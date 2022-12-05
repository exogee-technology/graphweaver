import { BackendProvider, PaginationOptions, Sort } from '@exogee/graphweaver';
import { logger } from '@exogee/logger';
import { isUUID } from 'class-validator';
import { TokenSet, TokenSetParameters, XeroClient } from 'xero-node';

const { XERO_CLIENT_ID, XERO_CLIENT_SECRET, XERO_CLIENT_REDIRECT_URIS } = process.env;
if (!XERO_CLIENT_ID) throw new Error('XERO_CLIENT_ID is required in environment');
if (!XERO_CLIENT_SECRET) throw new Error('XERO_CLIENT_SECRET is required in environment');
if (!XERO_CLIENT_REDIRECT_URIS)
	throw new Error('XERO_CLIENT_REDIRECT_URIS is required in environment');

const xero = new XeroClient({
	clientId: XERO_CLIENT_ID,
	clientSecret: XERO_CLIENT_SECRET,
	redirectUris: XERO_CLIENT_REDIRECT_URIS.split(' '),
	scopes: (process.env.XERO_SCOPES || 'accounting.reports.read').split(' '),
});

export interface XeroDataAccessor<T> {
	find: (args: { xero: XeroClient; filter?: string; order?: string }) => Promise<T[]>;
}

// This takes:
// {
// 	_or: [
// 		{ id: '123'},
// 		{ id: '234'},
// 	]
// }
// and turns it into a string like:
// AccountID=="123" OR AccountID=="234"
const xeroFilterFrom = (filter: any) => {
	if (!filter) return undefined;

	const chunks: string[] = [];

	for (const [key, value] of Object.entries(filter)) {
		if (key === '_or' || key === '_and') {
			const subChunks: string[] = [];
			for (const subChunk of value as any[]) {
				const subFilter = xeroFilterFrom(subChunk);
				if (subFilter) subChunks.push(subFilter);
			}

			if (key === '_or') chunks.push(`${subChunks.join(' OR ')}`);
			else chunks.push(`${subChunks.join(' AND ')}`);
		} else {
			const replacedKey = key === 'id' ? 'AccountID' : key;
			let subfilter =
				typeof value === 'object' ? xeroFilterFrom(value) : (value as string | undefined);

			// Some Xero types need to be quoted.
			if (isUUID(subfilter, 4)) {
				subfilter = `GUID("${subfilter}")`;
			} else if (typeof subfilter === 'string') {
				subfilter = `"${subfilter}"`;
			}

			if (key.endsWith('_gt')) {
				chunks.push(`${replacedKey}>${subfilter}`);
			} else if (key.endsWith('_gte')) {
				chunks.push(`${replacedKey}<=${subfilter}`);
			} else if (key.endsWith('_lt')) {
				chunks.push(`${replacedKey}<${subfilter}`);
			} else if (key.endsWith('_lte')) {
				chunks.push(`${replacedKey}<=${subfilter}`);
			} else {
				chunks.push(`${replacedKey}==${subfilter}`);
			}
		}
	}

	return chunks.join(' AND ') || undefined;
};

const xeroOrderFrom = (pagination?: PaginationOptions) => {
	if (!pagination || !pagination.orderBy) return undefined;

	const chunks: string[] = [];
	for (const [key, value] of Object.entries(pagination.orderBy)) {
		chunks.push(`${key} ${value}`);
	}

	return chunks.join(', ') || undefined;
};

export class XeroBackendProvider<T> implements BackendProvider<T> {
	public readonly backendId = 'xero-api';
	public readonly supportsInFilter = true;

	// Xero's API starts balking when we send requests with more than 25 OR filters in them.
	public readonly maxDataLoaderBatchSize = 25;

	public static accessTokenProvider: {
		get: () => Promise<TokenSet | TokenSetParameters> | TokenSet | TokenSetParameters;
		set: (newToken: TokenSet) => Promise<any>;
	};

	public constructor(protected entityTypeName: string, protected accessor?: XeroDataAccessor<T>) {}

	protected async ensureAccessToken() {
		await xero.initialize();
		let tokenSet = xero.readTokenSet();

		if (tokenSet.token_type !== 'Bearer') {
			logger.trace('Access token type is not Bearer, setting token');

			if (!XeroBackendProvider.accessTokenProvider)
				throw new Error(
					'You must set an access token provider on the XeroBackendProvider before accessing Xero.'
				);

			xero.setTokenSet(await XeroBackendProvider.accessTokenProvider.get());
			tokenSet = xero.readTokenSet();
		}

		if (tokenSet.expired()) {
			logger.trace('Access token expired. Refreshing.');
			await XeroBackendProvider.accessTokenProvider.set(await xero.refreshToken());
			logger.trace('Refresh complete.');
		}
	}

	// GET METHODS
	public async find(
		filter: any, // @todo: Create a type for this
		pagination?: PaginationOptions,
		additionalOptionsForBackend?: any // @todo: Create a type for this
	): Promise<T[]> {
		await this.ensureAccessToken();

		logger.trace(`Running find ${this.entityTypeName} with filter`, {
			filter: JSON.stringify(filter),
		});

		if (!this.accessor) {
			throw new Error(
				'Attempting to run a find on a Xero Backend Provider that does not have an accessor.'
			);
		}

		try {
			const result = await this.accessor.find({
				xero,
				filter: xeroFilterFrom(filter),
				order: xeroOrderFrom(pagination),
			});

			return result;
		} catch (error: any) {
			// Nicer error message if we can muster it.
			if (error.response?.body) throw error.response.body;

			throw error;
		}
	}

	public async findOne(id: string): Promise<T | null> {
		await this.ensureAccessToken();

		logger.trace(`Running findOne ${this.entityTypeName} with ID ${id}`);

		if (!this.accessor) {
			throw new Error(
				'Attempting to run a find on a Xero Backend Provider that does not have an accessor.'
			);
		}

		const rows = await this.find({ id });
		return rows[0] || null;
	}

	public async findByRelatedId(
		entity: any,
		relatedField: string,
		relatedFieldIds: string[],
		filter?: any
	): Promise<T[]> {
		await this.ensureAccessToken();

		if (!this.accessor) {
			throw new Error(
				'Attempting to run a find on a Xero Backend Provider that does not have an accessor.'
			);
		}

		return this.find({
			_or: [relatedFieldIds.map((id) => ({ [relatedField]: id }))],
			...filter,
		});
	}

	// PUT METHODS
	public async updateOne(id: string, updateArgs: Partial<T & { version?: number }>): Promise<T> {
		await this.ensureAccessToken();

		logger.trace(`Running update one ${this.entityTypeName} with args`, {
			id,
			updateArgs,
		});

		throw new Error('Not implemented');
	}

	public async updateMany(updateItems: (Partial<T> & { id: string })[]): Promise<T[]> {
		await this.ensureAccessToken();

		logger.trace(`Running update many ${this.entityTypeName} with args`, {
			updateItems: updateItems,
		});

		throw new Error('Not implemented');
	}

	public async createOrUpdateMany(items: Partial<T>[]): Promise<T[]> {
		throw new Error('Not implemented');
	}

	// POST METHODS
	public async createOne(createArgs: Partial<T>): Promise<T> {
		throw new Error('Not implemented');
	}

	public async createMany(createItems: Partial<T>[]): Promise<T[]> {
		logger.trace(`Running create ${this.entityTypeName} with args`, {
			createItems,
		});

		throw new Error('Not implemented');
	}

	// DELETE METHODS
	public async deleteOne(id: string): Promise<boolean> {
		logger.trace(`Running delete ${this.entityTypeName} with id ${id}`);

		throw new Error('Not implemented');
	}

	public async deleteMany(ids: string[]): Promise<boolean> {
		logger.trace(`Running delete ${this.entityTypeName} with ids ${ids}`);

		throw new Error('Not implemented');
	}

	public getRelatedEntityId(entity: any, relatedIdField: string) {
		if (typeof entity === 'string') {
			return entity;
		}
		if (entity.id) {
			return entity.id;
		}
		throw new Error(`Unknown entity without an id: ${JSON.stringify(entity)}`);
	}

	public isCollection(entity: any) {
		return false;
	}
}
