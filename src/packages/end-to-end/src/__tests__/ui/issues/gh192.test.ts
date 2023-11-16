import { test, expect } from '@playwright/test';
import { config } from '../../../config';

test('ensure table refreshed after create', async ({ page }) => {
	await page.goto(config.adminUiUrl);
	await page.getByRole('link', { name: 'mikro-orm-sqlite' }).click();
	await page.getByRole('link', { name: 'Album' }).click();

	await page.locator('_react=Select', { hasText: 'Artist' }).click();
	await expect(page.getByText('A Cor Do Som')).toBeVisible();
	await page.getByText('A Cor Do Som').click();

	await expect(page.getByText('Infinity')).not.toBeVisible();

	await page.getByRole('button', { name: 'Create New Album' }).click();
	await page.getByRole('textbox', { name: 'title' }).fill('Infinity');

	await expect(page.locator('form').locator('_react=Select', { hasText: 'artist' })).toBeVisible();
	await page.locator('form').locator('_react=Select', { hasText: 'artist' }).click();
	await page.locator('form').getByText('A Cor Do Som').click();
	await page.locator('form').locator('_react=Select', { hasText: 'tracks' }).click();
	await page.locator('form').getByText('#9 Dream').click();
	await page.getByRole('button', { name: 'Save' }).click();

	await expect(page.getByText('Infinity')).toBeVisible();
});
