import { test, expect } from '@playwright/test';
import { config } from '../../config';

test('Expand datasource dropdown', async ({ page }) => {
	await page.goto(config.adminUiUrl);
	await page.getByRole('link', { name: config.datasource }).click();
	await page.getByRole('link', { name: 'Album' }).click();

	await expect(page.getByRole('heading', { name: 'Album' })).toBeVisible();
});
