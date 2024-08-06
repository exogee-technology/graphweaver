import Fastify, { FastifyInstance, FastifyRegisterOptions } from 'fastify';
import { ApolloServer, BaseContext } from '@apollo/server';
import cors from '@fastify/cors';
import fastifyApollo, { fastifyApolloDrainPlugin } from '@as-integrations/fastify';
import { GraphweaverPlugin } from '@exogee/graphweaver';
import { logger } from '@exogee/logger';
import { onRequestWrapper } from './utils';

export type StartServerOptions = {
	path: string;
	port: number;
	host?: string;
	configureFastify?: (fastify: FastifyInstance) => Promise<void> | void;
};

export const startStandaloneServer = async <TContext extends BaseContext>(
	{ port, host, path, configureFastify }: StartServerOptions,
	apollo: ApolloServer<TContext>,
	plugins: Set<GraphweaverPlugin<void>>
) => {
	logger.info(`Starting standalone server on ${host ?? '::'}:${port}`);

	const fastify = Fastify();

	await configureFastify?.(fastify);

	apollo.addPlugin(fastifyApolloDrainPlugin(fastify));

	await apollo.start();
	await fastify.register(cors);

	const options: FastifyRegisterOptions<any> = { path: path ?? '/' };
	await fastify.register(fastifyApollo(apollo), options);

	fastify.addHook('onRequest', (_, __, done) => {
		logger.trace('onRequest hook called');
		onRequestWrapper(plugins, async () => done());
	});

	await fastify.listen({
		port,
		host: host ?? '::',
	});
};
