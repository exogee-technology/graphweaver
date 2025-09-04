import { test, expect } from '@playwright/test';
import { config } from '../../../../config';

test('Ensure filtering by multiple items works', async ({ page }) => {
	await page.goto(config.adminUiUrl);
	await page.getByRole('link', { name: 'Album' }).click();

	await page.getByTestId('artist-filter').getByRole('combobox').click();
	await page.getByTestId('combo-option-AC/DC').click();
	await page.getByTestId('artist-filter').getByLabel('Toggle').click();
	await page.getByTestId('combo-option-Aaron Copland & London Symphony Orchestra').click();

	// Those rows should look like this:
	await expect(await page.getByTestId('table').getByRole('row').nth(1)).toContainText(
		'For Those About To Rock We Salute You'
	);
	await expect(await page.getByTestId('table').getByRole('row').nth(2)).toContainText(
		'Let There Be Rock'
	);
	await expect(await page.getByTestId('table').getByRole('row').nth(3)).toContainText(
		'A Copland Celebration, Vol. I'
	);

	// And there should be exactly 5 rows in the table: one header, one footer, and 3 data rows.
	await expect(await page.getByTestId('table').getByRole('row').count()).toBe(5);
});
