import { GraphweaverRequestEvent, GraphweaverPlugin } from '@exogee/graphweaver';

type NextFunction<T = unknown> = () => Promise<T>;

const wrapRequest = async <T>(
	plugins: GraphweaverPlugin<T>[],
	next: NextFunction<T>
): Promise<T> => {
	if (!plugins.length) {
		return next();
	}

	const plugin = plugins.shift();
	if (!plugin) {
		throw new Error('Graphweaver Plugin was undefined');
	}
	return plugin.next(GraphweaverRequestEvent.OnRequest, () => wrapRequest(plugins, next));
};

export const onRequestWrapper = async <T>(
	plugins: Set<GraphweaverPlugin<T>>,
	next: NextFunction<T>
): Promise<T> => {
	const onRequestPlugins = [...plugins].filter(
		(plugin) => plugin.event === GraphweaverRequestEvent.OnRequest
	);

	return wrapRequest<T>(onRequestPlugins, next);
};
