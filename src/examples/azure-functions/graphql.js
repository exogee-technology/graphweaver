// Azure Functions v4 entry: loads the built backend (dev: .graphweaver/backend from graphweaver start; deploy: use dist/ folder and its graphql.js)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { app } = require('@azure/functions');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const backend = require('./.graphweaver/backend/index.js');

app.http('graphql', {
	methods: ['GET', 'POST', 'OPTIONS'],
	authLevel: 'anonymous',
	route: '/', // respond at root (http://localhost:9001/) so it matches other Graphweaver backends
	handler: backend.azureHandler,
});
