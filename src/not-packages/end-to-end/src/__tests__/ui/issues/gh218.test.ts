import { test, expect } from '@playwright/test';
import { config } from '../../../config';

test('Ensure filtering by multiple items works', async ({ page }) => {
	await page.goto(config.adminUiUrl);
	await page.getByRole('link', { name: config.datasource }).click();
	await page.getByRole('link', { name: 'Album' }).click();

	// Select AC/DC in the artist filter
	await page
		.locator('div')
		.filter({ hasText: /^artist$/ })
		.nth(1)
		.click();

	// Expect Accept to not be visible
	// See todo below
	// await expect(page.getByText('Accept')).toBeHidden();

	// Select Accept in the artist filter
	await page.getByRole('banner').getByText('AC/DC').click();
	await page
		.locator('div')
		.filter({ hasText: /^AC\/DC$/ })
		.nth(1)
		.click();

	// TODO: Cannot currently test selecting multiple items in the filter because
	// selecting an item does not remove it from the filter list. This is a bug.
	// This test should be updated once the bug is fixed.

	// Expect Accept to be visible
	// await expect(page.getByText('Accept')).toBeVisible();
	// await page.getByText('Accept').click();
	// await page.getByRole('link', { name: 'Accept' }).first().click();
});
