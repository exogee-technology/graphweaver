/* eslint-disable @typescript-eslint/no-var-requires */
const { XeroClient } = require('xero-node');
const fs = require('fs');

const { XERO_CLIENT_ID, XERO_CLIENT_SECRET, XERO_CLIENT_REDIRECT_URIS } = process.env;
if (!XERO_CLIENT_ID) throw new Error('XERO_CLIENT_ID is required in environment');
if (!XERO_CLIENT_SECRET) throw new Error('XERO_CLIENT_SECRET is required in environment');
if (!XERO_CLIENT_REDIRECT_URIS)
	throw new Error('XERO_CLIENT_REDIRECT_URIS is required in environment');

exports.handler = async (event) => {
	// Initialise this inside the handler so it's always a fresh instance.
	const xero = new XeroClient({
		clientId: XERO_CLIENT_ID,
		clientSecret: XERO_CLIENT_SECRET,
		redirectUris: XERO_CLIENT_REDIRECT_URIS.split(' '),
		scopes: (
			process.env.XERO_SCOPES ||
			'openid profile email offline_access accounting.settings accounting.reports.read accounting.journals.read'
		).split(' '),
	});

	let token;
	let error;
	if (event.queryStringParameters?.['code']) {
		const url = `http://localhost:3000${event.path}?${Object.entries(event.queryStringParameters)
			.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
			.join('&')}`;

		console.log(url);
		try {
			token = await xero.apiCallback(url);
			await xero.updateTenants();
			fs.writeFileSync('./token.json', JSON.stringify(token, null, 4));
		} catch (e) {
			error = e;
		}
	}

	return {
		statusCode: 200,
		headers: { 'content-type': 'text/html' },
		body: `
			<html>
				<head>
					<title>Graphweaver - Connect to Xero</title>
				</head>
				<body>
					<a href="${await xero.buildConsentUrl()}">Connect to Xero</a>
					
					${
						error
							? `
								<p>Error from Xero (try connecting again)</p>
								<pre>${JSON.stringify(error, null, 4)}</pre>
							`
							: ''
					}
					${
						token
							? `
								<p>Token from Xero</p>
								<pre>${JSON.stringify(token, null, 4)}</pre>
								<p>This token has been saved to ./token.json, and you are ready to use the API.</p>
							`
							: ''
					}
					${
						xero.tenants.length
							? `
								<p>We have access to the following Xero Tenants:</p>
								<ul>
									${xero.tenants.map((tenant) => `<li>${tenant.tenantName} (ID: ${tenant.tenantId})</li>`).join('')}
								</ul>
							`
							: ''
					}
				</body>
			</html>
		`,
	};
};
