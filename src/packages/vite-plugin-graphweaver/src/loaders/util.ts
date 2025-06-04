import { resolve as resolvePath, join } from 'node:path';
import { stat } from 'node:fs/promises';

const expectedExtensions = ['js', 'ts', 'jsx', 'tsx'];

export const tryToResolvePath = async (path: string): Promise<string | undefined> => {
	// All of these empty try / catches are so that when files don't exist we just keep cracking along.
	try {
		if ((await stat(resolvePath(path))).isDirectory()) path = join(path, '/index');
		// eslint-disable-next-line no-empty
	} catch {}

	for (const extension of expectedExtensions) {
		try {
			const testPath = resolvePath(`${path}.${extension}`);

			await stat(testPath);

			// If we're on this line then we found it.
			return testPath;
			// eslint-disable-next-line no-empty
		} catch {}
	}
};
