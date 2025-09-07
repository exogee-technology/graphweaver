import { exec } from 'node:child_process';
import path from 'node:path';
import { writeFileSync } from 'node:fs';
import { printSchemaWithDirectives } from '@graphql-tools/utils';

const asyncExec = async (command: string) =>
	new Promise<void>((resolve, reject) => {
		const execCommand = exec(command);

		// Pipe stdout and stderr to parent process
		execCommand.stdout?.pipe(process.stdout);
		execCommand.stderr?.pipe(process.stderr);

		execCommand.on('close', (code) => {
			if (code === 0) return resolve();
			else return reject(`Process exited with code ${code}`);
		});
	});

export const generateTypes = async () => {
	try {
		console.log(`Generating Types...`);
		await asyncExec(`gw-types`);
		console.log(`Types generated.`);
	} catch (error: any) {
		console.error(`Generate Types Failed: ${error.message}`);
	}
};

export const printSchema = async (output?: string) => {
	try {
		const buildDir = path.join('file://', process.cwd(), `./.graphweaver/backend/index.js`);
		const { graphweaver } = await import(buildDir);

		if (!graphweaver?.schema) {
			console.warn(
				'No schema found. To print schema make sure that you export Graphweaver from your index file.'
			);
			process.exit(0);
		}

		const sdl = printSchemaWithDirectives(graphweaver.schema);

		if (output) {
			const outputPath = path.join(process.cwd(), output);
			writeFileSync(outputPath, sdl);
			console.log(`Schema printed to ${outputPath}`);
			return;
		} else {
			console.log(sdl);
		}
	} catch (error: any) {
		console.error(`Schema Print Failed: ${error.message}`);
	}
};
