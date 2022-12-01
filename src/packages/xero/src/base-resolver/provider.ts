import { BackendProvider, PaginationOptions } from '@exogee/graphweaver';
import { logger } from '@exogee/logger';
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
	find: (client: XeroClient) => Promise<T[]>;
}

export class XeroBackendProvider<T> implements BackendProvider<T> {
	public readonly backendId = 'xero-api';
	public entityType: new () => T;
	public readonly supportsInFilter = true;

	public static accessTokenProvider: {
		get: () => Promise<TokenSet | TokenSetParameters> | TokenSet | TokenSetParameters;
		set: (newToken: TokenSet) => Promise<any>;
	};

	public constructor(xeroResultType: new () => T, protected accessor?: XeroDataAccessor<T>) {
		this.entityType = xeroResultType;
	}

	protected async ensureAccessToken() {
		const tokenSet = xero.readTokenSet();
		if (tokenSet.token_type !== 'Bearer') {
			logger.trace('Access token type is not Bearer, setting token');

			if (!XeroBackendProvider.accessTokenProvider)
				throw new Error(
					'You must set an access token provider on the XeroBackendProvider before accessing Xero.'
				);

			xero.setTokenSet(await XeroBackendProvider.accessTokenProvider.get());
		}

		console.log('Expired: ', tokenSet.expired());
		console.log('Token Set: ', tokenSet.expires_at);
		console.log('Expires in: ', tokenSet.expires_in);

		if (tokenSet.expired()) {
			logger.trace('Access token expired. Refreshing.');
			const result = await xero.refreshToken();
			await XeroBackendProvider.accessTokenProvider.set(result);
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

		logger.trace(`Running find ${this.entityType.name} with filter`, {
			filter: JSON.stringify(filter),
		});

		if (!this.accessor)
			throw new Error(
				'Attempting to run a find on a Xero Backend Provider that does not have an accessor.'
			);

		return this.accessor.find(xero);
	}

	public async findOne(id: string): Promise<T | null> {
		await this.ensureAccessToken();

		logger.trace(`Running findOne ${this.entityType.name} with ID ${id}`);

		return {} as T;
	}

	public async findByRelatedId(
		entity: any,
		relatedField: string,
		relatedFieldIds: string[],
		filter?: any
	): Promise<T[]> {
		await this.ensureAccessToken();

		return [];
	}

	// PUT METHODS
	public async updateOne(id: string, updateArgs: Partial<T & { version?: number }>): Promise<T> {
		await this.ensureAccessToken();

		logger.trace(`Running update one ${this.entityType.name} with args`, {
			id,
			updateArgs,
		});

		throw new Error('Not implemented');
	}

	public async updateMany(updateItems: (Partial<T> & { id: string })[]): Promise<T[]> {
		await this.ensureAccessToken();

		logger.trace(`Running update many ${this.entityType.name} with args`, {
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
		logger.trace(`Running create ${this.entityType.name} with args`, {
			createItems,
		});

		throw new Error('Not implemented');
	}

	// DELETE METHODS
	public async deleteOne(id: string): Promise<boolean> {
		logger.trace(`Running delete ${this.entityType.name} with id ${id}`);

		throw new Error('Not implemented');
	}

	public async deleteMany(ids: string[]): Promise<boolean> {
		logger.trace(`Running delete ${this.entityType.name} with ids ${ids}`);

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
