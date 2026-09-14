module.exports = {
	adminUI: {
		auth: {
			primaryMethods: ['PASSWORD'],
			secondaryMethods: ['API_KEY', 'ONE_TIME_PASSWORD', 'MAGIC_LINK', 'WEB3', 'PASSKEY'],
		},
	},
};
