import { exec } from 'child_process';

const asyncExec = async (command: string) => {
	const output = await new Promise((resolve, reject) => {
		const childProcess = exec(command);
		if (childProcess.stdout)
			childProcess.stdout.on('data', (data) => {
				resolve(`exec success: ${data}`);
			});
		if (childProcess.stderr)
			childProcess.stderr.on('data', (data) => {
				resolve(`stderr error: ${data}`);
			});
		childProcess.on('close', (code) => {
			resolve(`exec success: 'close'  ${code}`);
		});
		childProcess.on('exit', (code) => {
			resolve(`exec success: 'exit' ${code}`);
		});
		childProcess.on('error', (error) => {
			resolve(`exec error: ${error}`);
		});
	});
	return output;
};

export const generateTypes = async () => {
	await asyncExec(`gw-types`);
};
