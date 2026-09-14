import { exec } from 'node:child_process';
import path from 'node:path';
import { writeFileSync } from 'node:fs';
import { printSchemaWithDirectives } from '@graphql-tools/utils';
import { config } from '@exogee/graphweaver-config';

const asyncExec = async (command: string) =>
	new Promise<void>((resolve, reject) => {
		const execCommand = exec(command);

		// Pipe stdout and stderr to parent process
		execCommand.stdout?.pipe(process.stdout);
		execCommand.stderr?.pipe(process.stderr);

		execCommand.on('close', (code) => {
			if (code === 0) return resolve();
			else return reject(new Error(`Process exited with code ${code}`));
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

/** Returns true when it generated something, so the caller knows to rebuild. */
export const generateTrustedDocuments = async () => {
	// Nothing to do, and no reason to spawn a process that would boot the app to find that out.
	if (!Object.keys(config().trustedDocuments?.allowLists ?? {}).length) return false;

	try {
		console.log(`Generating Trusted Documents...`);
		await asyncExec(`gw-trusted-documents`);
		return true;
	} catch (error: any) {
		// Unlike types, a failure here is fatal: shipping a stale or empty manifest would lock
		// clients out of the API, or worse, let through documents that are no longer allowed.
		console.error(`Generate Trusted Documents Failed: ${error.message}`);
		throw error;
	}
};
