module.exports = {
	backend: {
		additionalFunctions: [
			{
				handlerPath: './connect',
				handlerName: 'handler',
				urlPath: 'connect',
				method: 'GET',
			},
		],
	},
};
