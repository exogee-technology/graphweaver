import { test, expect } from '@playwright/test';
import { config } from '../../config';

test('Expand datasource dropdown', async ({ page }) => {
	await page.goto(config.adminUiUrl);
	await page.getByRole('link', { name: 'mikro-orm-sqlite' }).click();
	await page.getByRole('link', { name: 'Album' }).click();

	await expect(page.getByRole('heading', { name: 'Album' })).toBeVisible();
});

test('Navigate to entity then click through to related entity from one of the records', async ({
	page,
}) => {
	await page.goto('http://localhost:9000/');
	await page.getByRole('link', { name: 'mikro-orm-sqlite' }).click();
	await page.getByRole('link', { name: 'Artist' }).click();
	await expect(page.url()).toBe('http://localhost:9000/Artist');
	await page.getByRole('link', { name: 'Facelift' }).click();
	await expect(page.url()).toBe('http://localhost:9000/Album/7');
	await expect(page.locator('form')).toContainText('12 Selected');
	await expect(page.getByText('Selected')).toBeVisible();
	await expect(
		page.getByText(
			'idtitleartistAlice In Chainstracks12 Selected×We Die Young×Man In The Box×Sea Of'
		)
	).toBeVisible();
});
