// Yes, we generally don't want requires, but here we actually do.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { exec } = require('node:child_process');

// This whole script is here just to assert that the output of the federation test command
// matches what we expect.
const expectedOutput = `*************
Federation v1 compatibility
*************
_service PASS
@key (single) PASS
@key (multi) WARNING
@key (composite) WARNING
repeatable @key WARNING
@requires PASS
@provides PASS
federated tracing PASS

*************
Federation v2 compatibility
*************
@link PASS
@shareable PASS
@tag PASS
@override PASS
@inaccessible PASS
@composeDirective PASS
@interfaceObject PASS
`;

exec(
	'npx fedtest docker --compose docker-compose.yaml --schema schema.graphql',
	(err, stdout, stderr) => {
		if (err) throw err;
		console.log(stdout);

		if (!stdout.endsWith(expectedOutput)) {
			console.log('stderr: ', stderr);

			throw new Error(
				`Unexpected output. Received: "${stdout}", expected to end with "${expectedOutput}"`
			);
		}

		console.log(
			'Integration test passed. Got all PASS except @key (multi), @key (composite), repeatable @key as expected.'
		);
	}
);
