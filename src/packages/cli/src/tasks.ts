import { exec } from 'child_process';

const asyncExec = async (command: string) =>
	new Promise<void>((resolve, reject) => {
		const execCommand = exec(command, (error) => {
			if (error) {
				return reject(error);
			}
			resolve();
		});
		execCommand.stdout?.pipe(process.stdout);
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
