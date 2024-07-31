import { test, expect } from '@playwright/test';
import { config } from '../../../config';

test('Detail Panel - should allow editing of an entity with an enum dropdown', async ({ page }) => {
	await page.goto(config.adminUiUrl);
	await page.getByRole('link', { name: 'mikro-orm-postgresql' }).click();

	await page.getByTestId('Invoice-entity-link').click();
	await page.getByRole('cell', { name: '1', exact: true }).click();

	// This invoice starts in 'UNPAID' status, so let's change that.
	await page.getByTestId('detail-panel-field-paymentStatus').getByRole('combobox').click();
	await page.getByRole('option', { name: 'PAID', exact: true }).click();

	// We should have 'PAID' selected now.
	await expect(page.getByTestId('detail-panel-field-paymentStatus')).toContainText(
		'paymentStatusPAID×'
	);
});
