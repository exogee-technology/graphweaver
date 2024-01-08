import { execSync } from 'child_process';

export const generateTypes = (outdir: string, resolvers: string) => {
	execSync(
		`tsx ./node_modules/graphweaver/bin/gw-types --outdir=${outdir} --resolvers=${resolvers}`,
		{
			stdio: 'inherit',
		}
	);
};
