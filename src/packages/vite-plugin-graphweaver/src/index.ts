import path from 'path';
import { Plugin } from 'vite';
import { loadDashboards } from './loaders';

export interface ViteGraphweaverOptions {
	configPath?: string;
}

const resolved = (virtualModuleId: string) => `\0${virtualModuleId}`;

const defaultSettings: ViteGraphweaverOptions = {
	configPath: path.resolve('.', 'graphweaver-config.js'),
};

export default function graphweaver(options: ViteGraphweaverOptions = {}): Plugin {
	const settings = { ...defaultSettings, ...options };

	// Ensure the config path is an absolute path.
	settings.configPath = settings.configPath
		? path.resolve(settings.configPath)
		: defaultSettings.configPath;

	const virtualModuleId = 'virtual:graphweaver-user-supplied-dashboards';
	const resolvedVirtualModuleId = resolved(virtualModuleId);

	let adminUiPath: string | null = null;

	return {
		name: 'vite-plugin-graphweaver',
		configResolved(config) {
			adminUiPath = config.root;
		},
		resolveId(id) {
			if (!adminUiPath) throw new Error('Config must be resolved to resolve specific files.');

			// This function allows the node module to exist in either the user's
			// node_modules directory, or in the admin-ui package's node_modules directory.
			if (id === virtualModuleId) return resolvedVirtualModuleId;

			// Ok, if it's not any of our virtual modules, it may be in the user's project
			// directory.
			try {
				// Try to find it in the user's project folder or Admin UI, either is fine.
				const userNodeModule = require.resolve(id, { paths: [adminUiPath, process.cwd()] });
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
				if (!settings.configPath) throw new Error('Config path should be resolved by now.');

				return await loadDashboards(settings.configPath);
			}
		},
	};
}
