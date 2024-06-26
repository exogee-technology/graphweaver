import { test, expect } from '@playwright/test';
import { config } from '../../../../config';

test('Filters - should not error when used without clearing', async ({ page }) => {
	await page.goto(config.adminUiUrl);
	await page.getByRole('link', { name: config.datasource }).click();

	const entityLinks = page.getByTestId(/-entity-link$/);

	// Select a filter on the first page
	await entityLinks.nth(0).click();
	await page
		.getByTestId(/-filter$/)
		.nth(0)
		.getByRole('combobox')
		.click();
	await page.getByRole('option').nth(0).click();

	// Without clearing, select a filter on the second page.
	await entityLinks.nth(1).click();
	await page
		.getByTestId(/-filter$/)
		.nth(0)
		.getByRole('combobox')
		.click();
	await page.getByRole('option').nth(0).click();

	// We should not have an error.
	expect(await page.getByText('Unhandled Error').count()).toBe(0);
	expect(await page.getByText('Error!').allInnerTexts()).toStrictEqual([]);
});
