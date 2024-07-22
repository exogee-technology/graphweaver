import Fastify, { FastifyRegisterOptions, HookHandlerDoneFunction } from 'fastify';
import { ApolloServer, BaseContext } from '@apollo/server';
import cors from '@fastify/cors';
import fastifyApollo, { fastifyApolloDrainPlugin } from '@as-integrations/fastify';
import { GraphweaverLifecycleEvent, GraphweaverPlugin } from '@exogee/graphweaver';

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
	plugins: GraphweaverPlugin[] = []
) => {
	const fastify = Fastify({});

	apollo.addPlugin(fastifyApolloDrainPlugin(fastify));

	await apollo.start();

	await fastify.register(cors);

	const options: FastifyRegisterOptions<any> = {
		path: '/',
	};
	await fastify.register(fastifyApollo(apollo), options);

	fastify.addHook('onRequest', (_, __, done) => {
		wrapRequest(plugins, done);
	});

	await fastify.listen({
		port,
		host: host ?? '::',
	});
};
