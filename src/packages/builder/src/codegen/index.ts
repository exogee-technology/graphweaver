import fs from 'fs';
import path from 'path';
import { executeCodegen } from '@graphql-codegen/cli';
import { createDirectoryIfNotExists } from '../util';
import { patchFile } from './patch';

const outputDirectory = './src/__generated__/';
const outputPath = path.join(process.cwd(), outputDirectory);

export const exportTypes = async () => {
	try {
		const files = await executeCodegen({
			cwd: process.cwd(),
			schema: 'http://localhost:9001',
			documents: ['./src/**/*.tsx', './src/**/*.ts'],
			generates: {
				[outputDirectory]: {
					preset: 'client',
				},
			},
		});
		createDirectoryIfNotExists(outputPath);

		for (const file of files) {
			const filePath = path.join(process.cwd(), file.filename);
			fs.writeFileSync(filePath, patchFile(file.filename, file.content), 'utf8');
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
