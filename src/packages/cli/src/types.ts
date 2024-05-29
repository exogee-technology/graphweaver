import { exec } from 'child_process';

const asyncExec = async (command: string) =>
	new Promise((resolve, reject) => {
		const childProcess = exec(command, (error) => {
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
	} catch (error) {
		console.error(`Generate Types Failed: ${error.message}`);
	}
};
