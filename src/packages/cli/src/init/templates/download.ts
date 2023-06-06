import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { dirname } from 'path';
import { Octokit } from '@octokit/rest';
import { throttling } from '@octokit/plugin-throttling';
import { GRAPHWEAVER_TARGET_VERSION } from '../constants';

const owner = 'exogee-technology';
const repo = 'graphweaver';
const root = 'src/examples';

type Branch = {
	path: string;
	type: 'file' | 'submodule' | 'symlink';
	sha: string;
};

type File = {
	path: string;
	contents: Buffer;
};

const createDirectories = async (filepath: string) => {
	const dir = dirname(filepath);
	return mkdirSync(dir, { recursive: true });
};

const formatPath = (file: File, projectName: string, exampleName: string): string => {
	const path = file.path.replace(`${root}/${exampleName}`, '');
	return `${projectName}/${path}`;
};

const output = async (file: File, projectName: string, exampleName: string) => {
	const path = formatPath(file, projectName, exampleName);
	await createDirectories(path);
	writeFileSync(path, file.contents);
};

export class Downloader {
	octokit: Octokit;

	constructor() {
		const ThrottledOctokit = Octokit.plugin(throttling);
		this.octokit = new ThrottledOctokit({
			auth: 'token ',
			throttle: {
				onSecondaryRateLimit: (retryAfter, options) => {
					/* ... */
				},
				onRateLimit: (retryAfter, options) => {
					/* ... */
				},
			},
		});
	}

	async recurseTree(path: string): Promise<Branch[]> {
		const { data } = await this.octokit.repos.getContent({
			owner,
			repo,
			path,
		});

		if (!Array.isArray(data)) throw new Error('Expected Array');

		const recurseDirs = data.map(async (node) => {
			if (node.type === 'dir') {
				return this.recurseTree(node.path);
			}
			return {
				path: node.path,
				type: node.type,
				sha: node.sha,
			};
		});

		return Promise.all(recurseDirs).then((nodes) => nodes.flat());
	}

	async fetchFiles(exampleName: string) {
		const path = `${root}/${exampleName}`;
		const tree = await this.recurseTree(path);

		const files = tree
			.filter((node) => node.path.startsWith(path) && node.type === 'file')
			.map(async (node) => {
				const { data } = await this.octokit.git.getBlob({
					owner,
					repo,
					file_sha: node.sha,
				});
				return {
					path: node.path,
					contents: Buffer.from(data.content, data.encoding as BufferEncoding),
				};
			});

		return Promise.all(files);
	}

	async download(projectName: string, exampleName: string) {
		const files = await this.fetchFiles(exampleName);
		await Promise.all(files.map((file) => output(file, projectName, exampleName)));

		// Update the versions in the package json
		const packageJson = readFileSync(`${projectName}/package.json`, 'utf8');
		writeFileSync(
			`${projectName}/package.json`,
			packageJson.replaceAll('workspace:*', GRAPHWEAVER_TARGET_VERSION)
		);
	}
}
