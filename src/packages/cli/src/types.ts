import { execSync } from 'child_process';

export const generateTypes = async (outDir: string) => {
	execSync(`gw-types --outdir=${outDir}`, {
		stdio: 'inherit',
	});
};
