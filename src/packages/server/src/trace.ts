import { ApolloServer, BaseContext } from '@apollo/server';
import {
	setDisableTracingForRequest,
	setEnableTracingForRequest,
	trace,
} from '@exogee/graphweaver';
import { OperationDefinitionNode, parse } from 'graphql';

export const enableTracing = <TContext extends BaseContext>(server: ApolloServer<TContext>) => {
	// Wrap the executeHTTPGraphQLRequest method with a trace span
	// This will allow us to trace the entire request from start to finish
	const executeHTTPGraphQLRequest = server.executeHTTPGraphQLRequest;
	server.executeHTTPGraphQLRequest = trace((request, trace) => {
		const body = request.httpGraphQLRequest.body as
			| { operationName: string; query: string }
			| undefined;
		const operationName = body?.operationName ?? 'Graphweaver Request';

		const gql = parse(body?.query ?? '');
		const type = (gql.definitions[0] as OperationDefinitionNode)?.operation ?? '';

		trace?.span.updateName(operationName);
		trace?.span.setAttributes({
			'X-Amzn-RequestId': request.httpGraphQLRequest.headers.get('x-amzn-requestid'),
			'X-Amzn-Trace-Id': request.httpGraphQLRequest.headers.get('x-amzn-trace-id'),
			body: JSON.stringify(request.httpGraphQLRequest.body),
			method: request.httpGraphQLRequest.method,
			type,
		});

		const suppressTracing = request.httpGraphQLRequest.headers.get(
			'x-graphweaver-suppress-tracing'
		);

		if (suppressTracing === 'true') {
			return setDisableTracingForRequest(() => {
				return executeHTTPGraphQLRequest.bind(server)(request);
			});
		} else {
			return setEnableTracingForRequest(() => {
				return executeHTTPGraphQLRequest.bind(server)(request);
			});
		}
	});
};