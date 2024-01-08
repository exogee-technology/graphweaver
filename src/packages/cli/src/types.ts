import { codeGenerator } from '@exogee/graphweaver-builder';
import path from 'path';

export const generateTypes = async (outdir: string) => {
	const buildDir = path.join(process.cwd(), './dist/backend/index.js');
	await import(buildDir);
	await codeGenerator(outdir);
};
