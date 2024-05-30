import { BackendProvider, graphweaverMetadata } from '..';

export function Provider<G = unknown, D = unknown>(provider: BackendProvider<D>) {
	return (target: { new (...args: any[]): G }) => {
		graphweaverMetadata.collectProviderInformationForEntity({
			provider,
			target,
		});

		return target;
	};
}
