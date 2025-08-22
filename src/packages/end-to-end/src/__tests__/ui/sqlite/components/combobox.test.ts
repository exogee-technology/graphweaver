import { expect, test } from '@playwright/test';
import { config } from '../../../../config';
import { bodyHasText } from '../../../../utils';

test('Check Select field displays correct number of selected items based on initial values', async ({
	page,
}) => {
	await page.goto(config.adminUiUrl);
	await page.getByRole('link', { name: 'Album' }).click();
	await page.getByRole('cell', { name: 'For Those About To Rock' }).first().click();

	// Expect "For Those About To Rock" to have 10 tracks+
	await expect(page.getByText(/\d+ Selected/)).toBeVisible();
});

test('Check Select field shows correct number of selected items after adding additional item to selection', async ({
	page,
}) => {
	await page.goto(config.adminUiUrl);
	await page.getByRole('link', { name: 'Album' }).click();
	await page.getByRole('cell', { name: '3', exact: true }).click();
	await page.waitForResponse(bodyHasText('Eine Kleine Nachtmusik'));
	await page.locator('input#detail-panel-field-tracks-input').click({ delay: 1000 });
	await page.getByRole('listbox').getByText('"40"').click();
	await expect(page.locator('form')).toContainText('4 Selected');
});

test('Check adding additional item to OneToMany field and saving functions as expected', async ({
	page,
}) => {
	await page.goto(config.adminUiUrl);
	await page.getByRole('link', { name: 'Album' }).click();
	await page.getByRole('cell', { name: 'For Those About To Rock We' }).click();
	await page.waitForResponse(bodyHasText('Eine Kleine Nachtmusik'));
	await page.locator('input#detail-panel-field-tracks-input').click({ delay: 1000 });
	await page.locator('li').getByText('"40"').click();
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
	await page.getByRole('link', { name: 'Employee' }).click();

	await page.getByTestId('employee-filter').click();
	await page.getByTestId('employee-filter').press('ArrowDown', { delay: 300 });
	await page.getByTestId('employee-filter').press('ArrowDown', { delay: 300 });
	await page.getByTestId('employee-filter').press('Enter', { delay: 300 });
	await expect(await page.getByText('IT Manager×')).toBeVisible();
	await page.getByText('IT Manager×').press('Delete');
	await expect(await page.getByText('IT Manager×')).not.toBeVisible();
});
