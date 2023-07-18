import { Plugin } from 'vite';
import { loadCustomPages, loadCustomFields } from './loaders';

const resolved = (virtualModuleId: string) => `\0${virtualModuleId}`;

export interface ViteGraphweaverOptions {
	projectRoot?: string;
}

const graphweaverPlugin = ({
	projectRoot = process.cwd(),
}: ViteGraphweaverOptions = {}): Plugin => {
	const virtualModuleId = 'virtual:graphweaver-user-supplied-custom-pages';
	const resolvedVirtualModuleId = resolved(virtualModuleId);

	const virtualCustomFieldsModuleId = 'virtual:graphweaver-user-supplied-custom-fields';
	const resolvedVirtualCustomFieldModuleId = resolved(virtualCustomFieldsModuleId);

	let adminUiPath: string | undefined;

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
			if (id === virtualCustomFieldsModuleId) return resolvedVirtualCustomFieldModuleId;

			// Ok, if it's not any of our virtual modules, it may be in the user's project
			// directory.
			try {
				// Try to find it in the user's project folder or Admin UI, either is fine.
				const userNodeModule = require.resolve(id, { paths: [adminUiPath, projectRoot] });
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
			if (!projectRoot) throw new Error('Config must be resolved to resolve specific files.');

			if (id === resolvedVirtualModuleId) return await loadCustomPages(projectRoot);

			if (id === resolvedVirtualCustomFieldModuleId) return await loadCustomFields(projectRoot);
		},
	};
};

export default graphweaverPlugin;
