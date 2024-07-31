import { BaseLoaderRequestContextPlugin, GraphweaverPlugin } from '@exogee/graphweaver';

class GraphweaverPluginManager {
	private plugins: Map<string, GraphweaverPlugin> = new Map();

	constructor() {
		// Add the Graphweaver RequestContext plugin
		this.plugins.set('BaseLoaderRequestContextPlugin', BaseLoaderRequestContextPlugin);
	}

	addPlugin(plugin: GraphweaverPlugin) {
		this.plugins.set(plugin.name, plugin);
	}

	getPlugins(): Set<GraphweaverPlugin> {
		return new Set(this.plugins.values());
	}
}

export const pluginManager = new GraphweaverPluginManager();
