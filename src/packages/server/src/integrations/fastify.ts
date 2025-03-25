import Fastify, { FastifyInstance, FastifyRegisterOptions } from 'fastify';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Http2ServerRequest, Http2ServerResponse } from 'node:http2';
import { ApolloServer, BaseContext } from '@apollo/server';
import cors from '@fastify/cors';
import fastifyApollo, { fastifyApolloDrainPlugin } from '@as-integrations/fastify';
import { GraphweaverPlugin } from '@exogee/graphweaver';
import { logger } from '@exogee/logger';
import { onRequestWrapper } from './utils';
import { GraphweaverConfig } from '../config';

export type StartServerOptions = {
	path: string;
	port: number;
	host?: string;
	configureFastify?: (
		fastify: FastifyInstance<
			any,
			IncomingMessage | Http2ServerRequest,
			ServerResponse<IncomingMessage> | Http2ServerResponse
		>
	) => Promise<void> | void;
};

export const startStandaloneServer = async <TContext extends BaseContext>(
	{ port, host, path, configureFastify }: StartServerOptions,
	{ fastifyOptions }: GraphweaverConfig,
	apollo: ApolloServer<TContext>,
	plugins: Set<GraphweaverPlugin<void>>
) => {
	logger.info(`Starting standalone server on ${host ?? '::'}:${port}`);

	const fastify = Fastify(fastifyOptions);

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

	// Always flush the logger on each request so logs get persisted.
	fastify.addHook('onResponse', async () => logger.flush());

	fastify.get('/health', async (_, reply) => {
		reply.statusCode = 200;
		reply.send({
			status: 'ok',
		});
	});

	await fastify.listen({
		port,
		host: host ?? '::',
	});
};
