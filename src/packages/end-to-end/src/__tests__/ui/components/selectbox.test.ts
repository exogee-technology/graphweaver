import { test, expect } from '@playwright/test';
import { config } from '../../../config';

test('Check Select field displays correct number of selected items based on initial values', async ({
	page,
}) => {
	await page.goto(config.adminUiUrl);
	await page.getByRole('link', { name: config.datasource }).click();
	await page.getByRole('link', { name: 'Album' }).click();
	await page.getByRole('gridcell', { name: 'For Those About To Rock' }).first().click();

	// Expect "For Those About To Rock" to have 10 tracks+
	await expect(page.getByText(/\d+ Selected/)).toBeVisible();
});

test('Check Select field shows correct number of selected items after adding additional item to selection', async ({
	page,
}) => {
	await page.goto(config.adminUiUrl);
	await page.getByRole('link', { name: config.datasource }).click();
	await page.getByRole('link', { name: 'Album' }).click();
	await page.getByRole('gridcell', { name: '3', exact: true }).click();
	await page
		.locator('div')
		.filter({ hasText: /^tracks\*3 Selected×$/ })
		.getByRole('combobox')
		.click({ delay: 1000 });
	await page.getByText('"40"').click();
	await expect(page.locator('form')).toContainText('4 Selected');
});

test('Check adding additional item to OneToMany field and saving functions as expected', async ({
	page,
}) => {
	await page.goto(config.adminUiUrl);
	await page.getByRole('link', { name: config.datasource }).click();
	await page.getByRole('link', { name: 'Album' }).click();
	await page.getByRole('gridcell', { name: 'For Those About To Rock We' }).click();
	await page
		.locator('div')
		.filter({ hasText: /^tracks\*10 Selected×$/ })
		.getByRole('combobox')
		.click({ delay: 1000 });
	await page.getByText('"40"').click();
	await expect(page.locator('form')).toContainText('11 Selected');
	await page.getByRole('button', { name: 'Save' }).click();
	await expect(
		await page.getByText(
			'Item 1 For Those About To Rock We Salute You has been successfully updated.'
		)
	).toBeVisible();
});

test('Should allow navigation around using a keyboard', async ({ page }) => {
	await page.goto(config.adminUiUrl);
	await page.getByRole('link', { name: config.datasource }).click();
	await page.getByRole('link', { name: 'Album' }).click();

	await page.getByRole('combobox').nth(1).click();
	await page.getByRole('combobox').nth(1).press('Tab', { delay: 300 });
	await page.getByRole('combobox').nth(2).press('ArrowDown', { delay: 300 });
	await page.getByRole('combobox').nth(2).press('ArrowDown', { delay: 300 });
	await page.getByRole('combobox').nth(2).press('ArrowDown', { delay: 300 });
	await page.getByRole('combobox').nth(2).press('Enter', { delay: 300 });
	await expect(await page.getByText('AC/DC×')).toBeVisible();
	await page.getByText('AC/DC×').press('Delete');
	await expect(await page.getByText('AC/DC×')).not.toBeVisible();
});
