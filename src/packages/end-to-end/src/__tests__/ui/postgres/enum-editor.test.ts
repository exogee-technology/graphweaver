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
	await page.getByRole('option', { name: '2' }).click();

	await expect(page.getByTestId('detail-panel-field-invoiceLines')).toContainText('invoiceLines1×');
});
