import { ApolloServerPlugin, BaseContext } from '@apollo/server';

class ApolloPluginManager<TContext extends BaseContext> {
	private plugins: Map<string, ApolloServerPlugin<TContext>> = new Map();

	constructor() {}

	addPlugin(name: string, plugin: ApolloServerPlugin<TContext>) {
		this.plugins.set(name, plugin);
	}

	getPlugins(): Set<ApolloServerPlugin<TContext>> {
		return new Set(this.plugins.values());
	}
}

export const apolloPluginManager = new ApolloPluginManager();
