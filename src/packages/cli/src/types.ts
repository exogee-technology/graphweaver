import { execSync } from 'child_process';

export const generateTypes = async () => {
	execSync(`gw-types`, { stdio: 'inherit' });
};
