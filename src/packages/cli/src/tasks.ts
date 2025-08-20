import { exec } from 'child_process';

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
		console.log(`Printing Schema...`);
		await asyncExec(`gw-print-schema${output ? ` -o ${output}` : ''}`);
	} catch (error: any) {
		console.error(`Schema Print Failed: ${error.message}`);
	}
};
