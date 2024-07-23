import Fastify, { FastifyRegisterOptions, HookHandlerDoneFunction } from 'fastify';
import { ApolloServer, BaseContext } from '@apollo/server';
import cors from '@fastify/cors';
import fastifyApollo, { fastifyApolloDrainPlugin } from '@as-integrations/fastify';
import { GraphweaverLifecycleEvent, GraphweaverPlugin } from '@exogee/graphweaver';
import { logger } from '@exogee/logger';

export type StartServerOptions = {
	path: string;
	port: number;
	host?: string;
};

const wrapRequest = async (plugins: GraphweaverPlugin[], done: HookHandlerDoneFunction) => {
	if (!plugins.length) {
		return done();
	}

	const plugin = plugins.shift();
	plugin?.next(GraphweaverLifecycleEvent.OnRequest, () => wrapRequest(plugins, done));
};

export const startStandaloneServer = async <TContext extends BaseContext>(
	{ port, host }: StartServerOptions,
	apollo: ApolloServer<TContext>,
	plugins: Set<GraphweaverPlugin>
) => {
	logger.info(`Starting standalone server on ${host ?? '::'}:${port}`);

	const fastify = Fastify({});

	apollo.addPlugin(fastifyApolloDrainPlugin(fastify));

	await apollo.start();

	await fastify.register(cors);

	const options: FastifyRegisterOptions<any> = {
		path: '/',
	};
	await fastify.register(fastifyApollo(apollo), options);

	fastify.addHook('onRequest', (_, __, done) => {
		const onRequestPlugins = [...plugins].filter(
			(plugin) => plugin.event === GraphweaverLifecycleEvent.OnRequest
		);

		logger.trace('onRequest hook called');
		console.log(onRequestPlugins);
		wrapRequest(onRequestPlugins, done);
	});

	await fastify.listen({
		port,
		host: host ?? '::',
	});
};
