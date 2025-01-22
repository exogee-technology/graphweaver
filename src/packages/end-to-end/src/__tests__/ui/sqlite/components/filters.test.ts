import { expect, test } from '@playwright/test';
import { config } from '../../../../config';

test('Filters - should not error when used without clearing', async ({ page }) => {
	await page.goto(config.adminUiUrl);
	await page.getByRole('link', { name: config.datasource }).click();

	const entityLinks = page.getByTestId(/-entity-link$/);

	// Select a filter on the first page
	await entityLinks.nth(0).click();
	await page.getByPlaceholder('AlbumId').fill('1');

	// Without clearing, select a filter on the second page.
	await entityLinks.nth(1).click();
	await page.getByPlaceholder('ArtistId').fill('1');

	// We should not have an error.
	expect(await page.getByText('Unhandled Error').count()).toBe(0);
	expect(await page.getByText('Error!').allInnerTexts()).toStrictEqual([]);
});
