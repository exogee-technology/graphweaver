import { codeGenerator } from '@exogee/graphweaver-builder';
import path from 'path';

export const createSchemaFile = async () => {
	const buildDir = path.join(process.cwd(), './dist/backend/index.js');
	await import(buildDir);
};

export const generateTypes = async (outdir: string) => {
	await codeGenerator(outdir);
};
