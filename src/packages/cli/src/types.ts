import { execSync } from 'child_process';

export const generateTypes = async (outdir: string) => {
	execSync(`gw-types --outdir=${outdir}`, {
		stdio: 'inherit',
	});
};
