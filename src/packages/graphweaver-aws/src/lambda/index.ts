import { Resolver, Mutation, Arg, Query, Ctx } from 'type-graphql';
import { InvokeCommand, LambdaClient, LogType } from '@aws-sdk/client-lambda';
import { GraphQLJSON } from 'graphql-type-json';

export interface CreateAwsLambdaUtilsOptions {
	defaultEndpoint?: string;
}

// @todo pass through context type
export const createAwsLambdaUtils = ({
	defaultEndpoint,
}: CreateAwsLambdaUtilsOptions): { resolver: any } => {
	@Resolver()
	class AwsLambdaUtilsResolver {
		@Mutation(() => GraphQLJSON)
		async awsLambdaInvoke(
			@Ctx() context: any,
			@Arg('functionName', () => String) FunctionName: string,
			@Arg('endpoint', () => String, { nullable: true }) endpoint?: string,
			@Arg('payload', () => GraphQLJSON, { nullable: true }) Payload?: unknown
		) {
			if (!context?.user?.roles?.includes('admin')) throw new Error('No Permission');

			const lambda = new LambdaClient({
				...(endpoint ? { endpoint } : defaultEndpoint ? { endpoint: defaultEndpoint } : {}),
			});

			const response = await lambda.send(
				new InvokeCommand({
					FunctionName,
					InvocationType: 'RequestResponse',
					LogType: LogType.None,
					Payload: JSON.stringify(Payload) as any, // the type is wrong, a string is taken here!
				})
			);

			if (response.Payload === undefined) return null;
			return JSON.parse(Buffer.from(response.Payload).toString());
		}
	}

	return {
		resolver: AwsLambdaUtilsResolver,
	};
};
