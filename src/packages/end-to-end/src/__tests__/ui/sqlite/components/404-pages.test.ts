import { test, expect } from '@playwright/test';
import { config } from '../../../../config';

test('404 Page - should show when accessing a genuine 404', async ({ page }) => {
	await page.goto(`${config.adminUiUrl}/non-existent-page/that/is/really/nested`);
	await expect(page.getByText('404 - Unknown Page')).toBeVisible();
});

test('Unknown Entity Page - should show when accessing an unknown URL', async ({ page }) => {
	await page.goto(`${config.adminUiUrl}/non-existent-page`);
	await expect(page.getByText('No such entity: non-existent-page')).toBeVisible();
});
