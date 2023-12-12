import { test, expect } from '@playwright/test';
import { config } from '../../../config';

test('ensure toast is displayed with the name of the item after creation', async ({ page }) => {
	await page.goto(config.adminUiUrl);
	await page.getByRole('link', { name: 'mikro-orm-sqlite' }).click();
	await page.getByRole('link', { name: 'Album' }).click();

	await page.locator('_react=Select', { hasText: 'Artist' }).click();
	await expect(page.getByText('A Cor Do Som')).toBeVisible();
	await page.getByText('A Cor Do Som').click();

	const title = 'Infinity';

	// pre-condition: Infinity text not found on the page
	await expect(page.getByText(title)).not.toBeVisible();

	// create new album called Infinity
	await page.getByRole('button', { name: 'Create New Album' }).click();
	await page.getByRole('textbox', { name: 'title' }).fill(title);

	await expect(page.locator('form').locator('_react=Select', { hasText: 'artist' })).toBeVisible();
	await page.locator('form').locator('_react=Select', { hasText: 'artist' }).click();
	await page.locator('form').getByText('A Cor Do Som').click();
	await page.locator('form').locator('_react=Select', { hasText: 'tracks' }).click();
	await page.locator('form').getByText('#9 Dream').click();
	await page.getByRole('button', { name: 'Save' }).click();

	// post-condition: Infinity text found on the page
	await expect(page.getByText(title)).toBeVisible();
});
