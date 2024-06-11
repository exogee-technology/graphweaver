import {
	BackendProvider,
	Filter,
	PaginationOptions,
	Sort,
	BackendProviderConfig,
} from '@exogee/graphweaver';
import { logger } from '@exogee/logger';
import { TokenSet, XeroClient } from 'xero-node';

export interface XeroDataAccessor<D> {
	find: (args: {
		xero: XeroClient;
		filter: Filter<D>;
		order?: Record<string, Sort>;
		limit?: number;
		offset?: number;
	}) => Promise<D[]>;
}

const xeroOrderFrom = (pagination?: PaginationOptions) => {
	if (!pagination || !pagination.orderBy) return undefined;

	if (Object.entries(pagination.orderBy).length > 0) {
		return pagination.orderBy;
	}
	return undefined;
};

const xeroLimitFrom = (pagination?: PaginationOptions) => {
	if (!pagination || pagination.limit === undefined || pagination.limit === null) return undefined;

	return pagination.limit;
};

const xeroOffsetFrom = (pagination?: PaginationOptions) => {
	if (!pagination || pagination.offset === undefined || pagination.offset === null)
		return undefined;

	return pagination.offset;
};

export class XeroBackendProvider<D = unknown> implements BackendProvider<D> {
	public readonly backendId = 'xero-api';
	public readonly supportsInFilter = true;

	// Xero's API starts balking when we send requests with more than 25 OR filters in them.
	public readonly maxDataLoaderBatchSize = 25;

	protected static xero: XeroClient;

	protected static resetXeroClient = () => {
		const { XERO_CLIENT_ID, XERO_CLIENT_SECRET, XERO_CLIENT_REDIRECT_URIS } = process.env;
		if (!XERO_CLIENT_ID) throw new Error('XERO_CLIENT_ID is required in environment');
		if (!XERO_CLIENT_SECRET) throw new Error('XERO_CLIENT_SECRET is required in environment');
		if (!XERO_CLIENT_REDIRECT_URIS)
			throw new Error('XERO_CLIENT_REDIRECT_URIS is required in environment');

		XeroBackendProvider.xero = new XeroClient({
			clientId: XERO_CLIENT_ID,
			clientSecret: XERO_CLIENT_SECRET,
			redirectUris: XERO_CLIENT_REDIRECT_URIS.split(' '),
			scopes: (process.env.XERO_SCOPES || 'accounting.reports.read').split(' '),
		});
	};

	public constructor(
		protected entityTypeName: string,
		protected accessor?: XeroDataAccessor<D>
	) {}

	// Default backend provider config
	public readonly backendProviderConfig: BackendProviderConfig = {
		filter: false,
		pagination: false,
		orderBy: false,
		sort: false,
	};

	public static clearTokens() {
		XeroBackendProvider.resetXeroClient();
	}

	public static setTokenSet(token: TokenSet) {
		XeroBackendProvider.resetXeroClient();
		XeroBackendProvider.xero.setTokenSet(token);
	}

	protected async ensureAccessToken() {
		if (!XeroBackendProvider.xero) XeroBackendProvider.resetXeroClient();
		await XeroBackendProvider.xero.initialize();
		const tokenSet = XeroBackendProvider.xero.readTokenSet();

		if (tokenSet.token_type !== 'Bearer') {
			logger.trace('Access token type is not Bearer, rejecting request');
			throw new Error('Error 1: Invalid token set');
		}

		if (tokenSet.expired()) {
			logger.trace('Access token is expired, rejecting request');
			throw new Error('Error 2: Invalid token set');
		}
	}

	// GET METHODS
	public async find(filter: Filter<D>, pagination?: PaginationOptions): Promise<D[]> {
		await this.ensureAccessToken();

		if (!this.accessor) {
			throw new Error(
				'Attempting to run a find on a Xero Backend Provider that does not have an accessor.'
			);
		}

		try {
			const result = await this.accessor.find({
				xero: XeroBackendProvider.xero,
				filter,
				order: xeroOrderFrom(pagination),
				limit: xeroLimitFrom(pagination),
				offset: xeroOffsetFrom(pagination),
			});

			logger.trace(
				`Find ${this.entityTypeName} with filter ${JSON.stringify(
					filter
				)} and pagination ${JSON.stringify(pagination)} returned ${result.length} rows.`
			);

			return result;
		} catch (error: any) {
			// Nicer error message if we can muster it.
			if (error.response?.body) throw error.response.body;

			throw error;
		}
	}

	public async findOne(filter: Filter<D>): Promise<D | null> {
		await this.ensureAccessToken();

		logger.trace(`Running findOne ${this.entityTypeName} with filter ${filter}`);

		if (!this.accessor) {
			throw new Error(
				'Attempting to run a find on a Xero Backend Provider that does not have an accessor.'
			);
		}

		const rows = await this.find(filter);
		return rows[0] || null;
	}

	public async findByRelatedId(
		entity: any,
		relatedField: string,
		relatedFieldIds: string[],
		filter?: any
	): Promise<D[]> {
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
	public async updateOne(id: string, updateArgs: Partial<D & { version?: number }>): Promise<D> {
		await this.ensureAccessToken();

		logger.trace(`Running update one ${this.entityTypeName} with args`, {
			id,
			updateArgs,
		});

		throw new Error('Not implemented');
	}

	public async updateMany(updateItems: (Partial<D> & { id: string })[]): Promise<D[]> {
		await this.ensureAccessToken();

		logger.trace(`Running update many ${this.entityTypeName} with args`, {
			updateItems: updateItems,
		});

		throw new Error('Not implemented');
	}

	public async createOrUpdateMany(): Promise<D[]> {
		throw new Error('Not implemented');
	}

	// POST METHODS
	public async createOne(): Promise<D> {
		throw new Error('Not implemented');
	}

	public async createMany(createItems: Partial<D>[]): Promise<D[]> {
		logger.trace(`Running create ${this.entityTypeName} with args`, {
			createItems,
		});

		throw new Error('Not implemented');
	}

	// DELETE METHODS
	public async deleteOne(): Promise<boolean> {
		throw new Error('Not implemented');
	}

	public async deleteMany(): Promise<boolean> {
		throw new Error('Not implemented');
	}
}
