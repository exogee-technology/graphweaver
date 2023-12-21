import { test, expect } from '@playwright/test';

test('Ensure filtering by multiple items works', async ({ page }) => {
	await page.goto('http://localhost:9000/');
	await page.getByRole('link', { name: 'mikro-orm-sqlite' }).click();
	await page.getByRole('link', { name: 'Album' }).click();

	// Select AC/DC in the artist filter
	await page
		.locator('div')
		.filter({ hasText: /^artist$/ })
		.nth(1)
		.click();

	// Expect Accept to not be visible
	await expect(page.getByText('Accept')).toBeHidden();

	// Select Accept in the artist filter
	await page.getByRole('banner').getByText('AC/DC').click();
	await page
		.getByText('AC/DC×AC/DC×A Cor Do SomAC/DCAaron Copland & London Symphony OrchestraAaron Gold')
		.click();

	// Expect Accept to be visible
	await expect(page.getByText('Accept')).toBeVisible();
	await page.getByText('Accept').click();
	await page.getByRole('link', { name: 'Accept' }).first().click();
});
