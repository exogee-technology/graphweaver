import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
	await page.goto('http://localhost:9000/');
	await page.getByRole('link', { name: 'mikro-orm-sqlite' }).click();
	await page.getByRole('link', { name: 'Album' }).click();
	await page.getByRole('gridcell', { name: 'For Those About To Rock' }).first().click();

	// Expect "For Those About To Rock" to have 10 tracks
	await expect(page.getByText('10 Selected')).toBeVisible();
});
