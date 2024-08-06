import Fastify, { FastifyRegisterOptions } from 'fastify';
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
};

export const startStandaloneServer = async <TContext extends BaseContext>(
	{ port, host }: StartServerOptions,
	apollo: ApolloServer<TContext>,
	plugins: Set<GraphweaverPlugin<void>>
) => {
	logger.info(`Starting standalone server on ${host ?? '::'}:${port}`);

	const fastify = Fastify();

	apollo.addPlugin(fastifyApolloDrainPlugin(fastify));

	await apollo.start();

	await fastify.register(cors);

	const options: FastifyRegisterOptions<any> = {
		path: '/',
	};
	await fastify.register(fastifyApollo(apollo), options);

	fastify.addHook('onRequest', (_, __, done) => {
		logger.trace('onRequest hook called');
		onRequestWrapper(plugins, async () => done());
	});

	await fastify.listen({
		port,
		host: host ?? '::',
	});

	return fastify;
};
