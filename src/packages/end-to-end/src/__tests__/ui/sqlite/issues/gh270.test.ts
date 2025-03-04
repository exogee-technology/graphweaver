import { test, expect } from '@playwright/test';
import { config } from '../../../../config';

test('should update number field from the detail panel', async ({ page }) => {
	await page.goto(config.adminUiUrl);
	await page.getByRole('link', { name: 'InvoiceLine' }).click();
	await page.getByRole('cell', { name: 'Balls to the wall' }).click();
	await page.getByLabel('quantity').click();
	await page.getByLabel('quantity').fill('3');
	await page.getByRole('button', { name: 'Save' }).click();
	await expect(await page.getByText('has been successfully updated.')).toBeVisible();
});
