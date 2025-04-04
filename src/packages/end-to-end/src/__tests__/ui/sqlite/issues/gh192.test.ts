import { expect, test } from '@playwright/test';
import { randomUUID } from 'crypto';

import { config } from '../../../../config';

test('ensure toast is displayed with the name of the item after creation', async ({ page }) => {
	await page.goto(config.adminUiUrl);
	await page.getByRole('link', { name: 'Album' }).click();

	await page.getByTestId('artist-filter').getByRole('combobox').click();
	await expect(page.getByText('A Cor Do Som')).toBeVisible();
	await page.getByText('A Cor Do Som').click();

	const title = randomUUID();

	// pre-condition: Infinity text not found on the page
	await expect(page.getByText(title)).not.toBeVisible();

	// create new album called Random UUID title
	await page.getByRole('button', { name: 'Create New Album' }).click();
	await page.waitForTimeout(1000);
	await page.getByLabel('title*').fill(title);

	await expect(page.locator('form').locator('label').filter({ hasText: 'artist' })).toBeVisible();
	await page.getByTestId('detail-panel-field-artist').getByRole('combobox').click(); // Click the artist dropdown
	await page.locator('form').getByText('A Cor Do Som').click();
	await page.getByTestId('detail-panel-field-tracks').getByRole('combobox').click();
	await page.locator('form').getByText('#9 Dream').click();
	await page.getByRole('button', { name: 'Save' }).click();

	// post-condition: Random UUID title text found on the page
	await expect(page.getByText(title).first()).toBeVisible();
});
