import { test, expect } from '@playwright/test';
import { config } from '../../../../config';

test.skip('Filters - should not error when cleared each time', async ({ page }) => {
	await page.goto(config.adminUiUrl);
	await page.getByRole('link', { name: config.datasource }).click();

	const entityLinks = page.getByTestId(/-entity-link$/);
	const entityCount = await entityLinks.count();

	for (let i = 0; i < entityCount; i++) {
		await entityLinks.nth(i).click();

		const filters = page.getByTestId(/-filter$/);
		const filterCount = await filters.count();
		for (let j = 0; j < filterCount; j++) {
			await filters.nth(j).getByRole('combobox').click();
			const optionCount = await page.getByRole('option').count();

			if (optionCount > 0) {
				await page.getByRole('option').nth(0).click();
				// By waiting for the count of rows text to be there, we can make sure the whole page has re-rendered after
				// the filter change.
				await page.getByText(/\(\d+ rows?\)/);
				expect(await page.getByText('Unhandled Error').count()).toBe(0);
				expect(await page.getByText('Error!').allInnerTexts()).toStrictEqual([]);

				await page.getByText('×').click();
				await page.getByText(/\(\d+ rows?\)/);
				expect(await page.getByText('Unhandled Error').count()).toBe(0);
				expect(await page.getByText('Error!').allInnerTexts()).toStrictEqual([]);
			}
		}
	}
});

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
