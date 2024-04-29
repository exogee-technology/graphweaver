const packageConf = (packageName) => {
	return {
		handler: `backend/index.handler`,
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
			host: 'localhost',
			httpPort: 9001,
		},
	},

	provider: {
		name: 'aws',
		runtime: 'nodejs18.x',
		timeout: 30,
		stage: 'api',

		environment: {
			LOGGING_LEVEL: process.env.LOGGING_LEVEL || 'trace',
		},

		apiGateway: {
			shouldStartNameWithService: true,
		},
	},

	functions: {
		graphqlV1Api: {
			...packageConf('graphql-api'),

			events: [
				{
					http: {
						path: '{proxy+}',
						method: 'ANY',
						cors: true,
					},
				},
			],
		},
	},
};

module.exports = config;
