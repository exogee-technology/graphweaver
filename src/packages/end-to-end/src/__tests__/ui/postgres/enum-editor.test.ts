import { test, expect } from '@playwright/test';
import { config } from '../../../config';

test('Detail Panel - should allow editing of an entity with an enum dropdown', async ({ page }) => {
	await page.goto(config.adminUiUrl);

	await page.getByTestId('Invoice-entity-link').click();
	await page.getByRole('cell', { name: '1', exact: true }).click();

	// This invoice starts in 'PAID' status, so let's change that.
	await expect(page.getByTestId('detail-panel-field-paymentStatus')).toContainText(
		'paymentStatusPAID×'
	);

	await page.getByTestId('detail-panel-field-paymentStatus').click();
	await page.getByRole('option', { name: 'UNPAID', exact: true }).click();

	// We should have 'PAID' selected now.
	await expect(page.getByTestId('detail-panel-field-paymentStatus')).toContainText(
		'paymentStatusUNPAID×'
	);
});

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
	await expect(page.getByTestId('artist-filter-box')).toContainText('Aaron Goldberg');

	// Re-open the list, and then the selected option should now be the first in the list
	await page.getByTestId('artist-filter-input').press('ArrowDown');
	await expect(page.getByRole('option').first()).toContainText('Aaron Goldberg');

	// Deselect
	await page.getByTestId('artist-filter-input').press('ArrowDown');
	await page.getByTestId('artist-filter-input').press('Enter');
	await expect(page.getByTestId('artist-filter-box')).not.toContainText('Aaron Goldberg');
});
