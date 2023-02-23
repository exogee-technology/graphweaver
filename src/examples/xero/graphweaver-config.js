module.exports = {
	backend: {
		additionalFunctions: [
			{
				handlerPath: './src/backend/connect',
				handlerName: 'handler',
				urlPath: 'connect',
				method: 'GET',
			},
		],
	},
};
