import { test, expect } from '@playwright/test';
import { config } from '../../../config';

test('Navigate to entity then click through to related entity from one of the records', async ({
	page,
}) => {
	await page.goto(config.adminUiUrl);
	await page.getByRole('link', { name: config.datasource }).click();
	await page.getByRole('link', { name: 'Artist' }).click();
	expect(page.url()).toBe(`${config.adminUiUrl}/Artist`);
	await page.getByRole('link', { name: 'Facelift' }).click();
	expect(page.url()).toBe(`${config.adminUiUrl}/Album/7`);
	await expect(page.locator('form')).toContainText('12 Selected');
	await expect(page.getByText('Selected')).toBeVisible();
	await expect(
		page.getByText(
			'idtitleartistAlice In Chainstracks12 Selected×We Die Young×Man In The Box×Sea Of'
		)
	).toBeVisible();
});
