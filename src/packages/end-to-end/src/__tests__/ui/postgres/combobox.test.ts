import { test, expect } from '@playwright/test';
import { config } from '../../../config';

test('Detail Panel - should allow deselecting of an entity in a one to many relationship field', async ({
	page,
}) => {
	await page.goto(config.adminUiUrl);

	await page.getByTestId('Invoice-entity-link').click();
	await page.getByRole('cell', { name: '1', exact: true }).click();

	// We should begin in this state
	await expect(page.getByTestId('detail-panel-field-invoiceLines')).toContainText(
		'invoiceLines2 Selected×'
	);

	await page.getByTestId('detail-panel-field-invoiceLines').click();
	await page.getByRole('option', { name: '2', exact: true }).click();

	await expect(page.getByTestId('detail-panel-field-invoiceLines')).toContainText('invoiceLines1×');
});

test('Filter - should be able to interact with and select options using the keyboard', async ({
	page,
}) => {
	await page.goto(config.adminUiUrl);
	await page.getByTestId('Album-entity-link').click();

	// First arrow press opens the list
	await page.getByTestId('artist-filter-input').press('ArrowDown');
	// Go down to the third option
	await page.getByTestId('artist-filter-input').press('ArrowDown');
	await page.getByTestId('artist-filter-input').press('ArrowDown');
	await page.getByTestId('artist-filter-input').press('ArrowDown');
	await page.getByTestId('artist-filter-input').press('Enter');
	await expect(page.getByTestId('artist-filter-box')).toHaveText(/^A/);
});

test('Filter - should be able to deselect options using the keyboard', async ({ page }) => {
	// Go to the Album table with AC/DC pre-selected in the artists filter
	await page.goto(
		`${config.adminUiUrl}/Album?filters=eyJhcnRpc3QiOnsiYXJ0aXN0SWRfaW4iOlsiMSJdfX0%3D`
	);
	// Open
	await page.getByTestId('artist-filter-input').press('ArrowDown');
	await expect(page.getByRole('option').first()).toContainText('AC/DC');

	// Deselect
	await page.getByTestId('artist-filter-input').press('ArrowDown');
	await page.getByTestId('artist-filter-input').press('Enter');
	await expect(page.getByTestId('artist-filter-box')).not.toContainText('AC/DC');
});
