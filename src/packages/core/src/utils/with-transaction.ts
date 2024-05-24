import { BackendProvider } from '../types';

export const withTransaction = async <G>(
	provider: BackendProvider<unknown, unknown>,
	callback: () => Promise<G>
) => {
	return provider.withTransaction ? provider.withTransaction<G>(callback) : callback();
};
