import { test, expect } from '@playwright/test';
import { config } from '../../../config';

test('ensure id field is not displayed on the detail form', async ({ page }) => {
	await page.goto(config.adminUiUrl);
	await page.getByRole('link', { name: 'mikro-orm-sqlite' }).click();
	await page.getByRole('link', { name: 'Album' }).click();

	// open detail form page
	await page.getByRole('button', { name: 'Create New Album' }).click();

	await expect(page.locator('form').getByText('id')).not.toBeVisible();
});
