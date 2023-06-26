import fs from 'fs';
import { executeCodegen } from '@graphql-codegen/cli';

const backendEndpoint = 'http://localhost:9001';

export const codeGenerator = async () => {
	try {
		const files = await executeCodegen({
			cwd: process.cwd(),
			schema: backendEndpoint,
			ignoreNoDocuments: true,
			documents: ['./src/**/!(*.generated).{ts,tsx}'],
			generates: {
				'src/types.generated.ts': {
					plugins: [
						{
							add: {
								content: '/* eslint-disable */',
							},
						},
						'typescript',
					],
				},
				'src/': {
					preset: 'near-operation-file',
					presetConfig: {
						extension: '.generated.tsx',
						baseTypesPath: 'types.generated.ts',
					},
					plugins: [
						{
							add: {
								content: '/* eslint-disable */',
							},
						},
						'typescript-operations',
						'typescript-react-apollo',
					],
				},
			},
		});

		for (const file of files) {
			fs.writeFileSync(file.filename, file.content, 'utf8');
		}
	} catch (err: any) {
		const defaultStateMessage = `Unable to find any GraphQL type definitions for the following pointers:`;
		if (err.message && err.message.includes(defaultStateMessage)) {
			// do nothing for now and silently fail
		} else {
			console.log(err.message + `\n in ${err.source?.name}`);
		}
	}
};
