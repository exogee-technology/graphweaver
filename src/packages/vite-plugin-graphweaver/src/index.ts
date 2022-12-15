import path from 'path';
import { Plugin } from 'vite';
import { loadDashboards } from './loaders';

export interface ViteGraphweaverOptions {
	dashboardDirectoryPath?: string;
}

const resolved = (virtualModuleId: string) => `\0${virtualModuleId}`;

const defaultSettings: ViteGraphweaverOptions = {
	dashboardDirectoryPath: path.join('.', 'src', 'dashboards'),
};

export default function graphweaver(options: ViteGraphweaverOptions = {}): Plugin {
	const settings = { ...defaultSettings, ...options };

	const virtualModuleId = 'virtual:graphweaver-user-supplied-dashboards';
	const resolvedVirtualModuleId = resolved(virtualModuleId);

	return {
		name: 'vite-plugin-graphweaver',
		resolveId(id) {
			// This function allows the node module to exist in either the user's
			// node_modules directory, or in the admin-ui package's node_modules directory.
			if (id === virtualModuleId) return resolvedVirtualModuleId;

			// Ok, if it's not any of our virtual modules, it may be in the user's project
			// directory.
			try {
				const userNodeModule = require.resolve(id, { paths: [process.cwd()] });
				if (userNodeModule) return userNodeModule;
			} catch (error: any) {
				// Module not found errors are expected, so we don't need to log them.
				if (error.code !== 'MODULE_NOT_FOUND') {
					console.error('Error while resolving module: ', error);
				}
			}

			// Ok, it's either one of ours or it's not found in general. Let the
			// default Vite behaviour happen for it.
		},
		async load(id) {
			if (id === resolvedVirtualModuleId) {
				return await loadDashboards(settings);
			}
		},
	};
}
