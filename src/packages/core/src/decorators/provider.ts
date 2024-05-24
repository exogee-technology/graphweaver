import { BackendProvider, BaseDataEntity, graphweaverMetadata } from '..';

export function Provider<G, D extends BaseDataEntity>(provider: BackendProvider<D, G>) {
	return (target: G) => {
		graphweaverMetadata.collectProviderInformationForEntity({
			provider,
			target,
		});

		return target;
	};
}
