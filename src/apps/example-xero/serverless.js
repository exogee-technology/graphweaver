// ######################################################
// Note, this is NOT the source of truth for how
// the infrastucture is deployed, it's used so we can
// easily run our functions locally only.
//
// The source of truth is the CDK code in the
// @exogee/infrastructure package.
// ######################################################

// We're using require here because this is a JS file that Node
// loads directly.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const dotenv = require('dotenv');

const packageConf = (packageName) => {
	return {
		handler: `node_modules/@exogee/${packageName}/lib/index.handler`,
		environment: dotenv.config().parsed,
	};
};

const config = {
	service: 'just-for-local-development',
	useDotenv: true,

	plugins: ['serverless-offline'],
	custom: {
		'serverless-offline': {
			noPrependStageInUrl: true,
			useWorkerThreads: true,
		},
	},

	provider: {
		name: 'aws',
		runtime: 'nodejs14.x',
		timeout: 30,
		stage: 'api',

		environment: {
			// In dev it's helpful to trace.
			LOGGING_LEVEL: process.env.LOGGING_LEVEL || 'trace',
		},

		// Prepare for the next version of Serverless
		apiGateway: {
			shouldStartNameWithService: true,
		},
	},

	package: {
		individually: true,
		excludeDevDependencies: true,
		patterns: ['!**'],
	},

	functions: {
		graphqlV1Api: {
			...packageConf('graphweaver-example-xero'),

			events: [
				{
					http: {
						path: 'graphql/v1/{proxy+}',
						method: 'ANY',
						cors: true,
					},
				},
			],
		},
		connectXero: {
			handler: `./connect.handler`,
			environment: dotenv.config().parsed,
			events: [
				{
					http: {
						path: 'connect',
						method: 'GET',
					},
				},
			],
		},
	},
};

module.exports = config;
