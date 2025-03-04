import { test, expect } from '@playwright/test';
import { config } from '../../../../config';

test('List Page', async ({ page }) => {
	await page.goto(config.adminUiUrl);
	await page.getByRole('link', { name: 'Artist' }).click();

	await expect(page.getByText('From mikro-orm-sqlite (275 rows)')).toBeVisible();
	await expect(page.getByRole('cell', { name: 'Plays Metallica By Four Cellos' })).toBeVisible();
});
