import { exec } from 'child_process';

const asyncExec = async (command: string) =>
	new Promise<void>((resolve, reject) => {
		exec(command, (error) => {
			if (error) {
				return reject(error);
			}
			resolve();
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
		console.log(`Generating Schema...`);
		await asyncExec(`print-schema${output ? ` -o ${output}` : ''}`);
		console.log(`Schema printed.`);
	} catch (error: any) {
		console.error(`Schema Print Failed: ${error.message}`);
	}
};
