export const config = {
	baseUrl: process.env.TEST_BASE_URL || 'http://localhost:9001',
	adminUiUrl: process.env.TEST_ADMIN_UI_URL || 'http://localhost:9000',
	appDirectory: process.env.TEST_APP_DIRECTORY || './app',
	datasource: process.env.TEST_DATASOURCE || 'mikro-orm-sqlite',
};
