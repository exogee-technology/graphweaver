import { resolve as resolvePath, join } from 'node:path';
import { stat } from 'node:fs/promises';

const expectedExtensions = ['js', 'ts', 'jsx', 'tsx'];

export const tryToResolvePath = async (path: string): Promise<string | undefined> => {
	try {
		if ((await stat(resolvePath(path))).isDirectory()) path = join(path, '/index');

		for (const extension of expectedExtensions) {
			try {
				await stat(resolvePath(`${path}.${extension}`));
				return resolvePath(`${path}.${extension}`);
			} catch {}
		}
	} catch {}
};
