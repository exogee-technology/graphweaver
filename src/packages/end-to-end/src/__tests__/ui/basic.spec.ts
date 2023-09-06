import { test, expect } from '@playwright/test';
import { config } from '../../config';

test('expand datasource dropdown', async ({ page }) => {
	await page.goto(config.adminUiUrl);
	await page.getByRole('link', { name: 'mikro-orm-sqlite' }).click();
	await page.getByRole('link', { name: 'Album' }).click();

	await expect(page.getByRole('heading', { name: 'Album' })).toBeVisible();
});
