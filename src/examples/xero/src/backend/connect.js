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
			<!DOCTYPE html>
			<html lang="en">
				<head>
					<meta charset="utf-8">
					<title>Graphweaver - Connect to Xero</title>
					<style>
						:root {
							font-family: 'Inter', sans-serif;
							--body-copy-color: #ede8f2;
							--body-bg-color: #100a1c;
							--primary-color: #7038c2;
							--secondary-color: #853af2;
						}
						@supports (font-variation-settings: normal) {
							:root {
								font-family: 'Inter var', sans-serif;
							}
						}
					
						* {
							font-family: 'Inter', sans-serif;
							color: var(--body-copy-color);
						}
					
						html,
						body,
						#root {
							margin: 0;
							-webkit-font-smoothing: antialiased;
							-moz-osx-font-smoothing: grayscale;
							background-color: var(--body-bg-color);
						
							line-height: 200%;
						
							height: 100%;

							display: flex;
							justify-content: center;
							align-items: center;
						}

						a {
							position: relative;
							box-sizing: border-box;
						
							padding: 8px 12px;
						
							background: var(--primary-color);
							border: 1px solid rgba(237, 232, 242, 0.2);
							box-shadow: 0px 1px 3px rgba(9, 5, 16, 0.1);
							border-radius: 6px;
							font-weight: 500;
							text-decoration: none;
						}
						
						a:hover {
							background-color: var(--secondary-color);
						}
						
						pre {
							font-family: source-code-pro, Menlo, Monaco, Consolas, "Courier New",
							  monospace;
					
							opacity: 0.6;
					
							width: 600px;
							white-space: nowrap;
							overflow: hidden;
							text-overflow: ellipsis;
							margin-left: 20px;
						}

						h1 {
							margin-top: 20px;
							font-style: normal;
							font-weight: 600;
							font-size: 16px;
							line-height: 140%;
						}

						p > span,
						li > span {
							opacity: 0.6;
						}

					</style>
				</head>
				<body>
					<div>
						<a href="${await xero.buildConsentUrl()}">Connect to Xero</a>
					
					${
						error
							? `
								<h1>Error from Xero (try connecting again)</h1>
								<pre>${JSON.stringify(error, null, 4)}</pre>
							`
							: ''
					}
					${
						token
							? `
								<h1>Token from Xero</h1>
								<pre>${JSON.stringify(token, null, 4)}</pre>
								<p>This token has been saved to <span>./token.json</span>, and you are ready to use the API.</p>
							`
							: ''
					}
					${
						xero.tenants.length
							? `
								<h1>We have access to the following Xero Tenants:</h1>
								<ul>
									${xero.tenants
										.map(
											(tenant) =>
												`<li>${tenant.tenantName} <span>(ID: ${tenant.tenantId})</span></li>`
										)
										.join('')}
								</ul>
							`
							: ''
					}
					</div>
				</body>
			</html>
		`,
	};
};
