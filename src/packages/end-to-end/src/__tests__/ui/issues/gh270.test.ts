import { test, expect } from '@playwright/test';
import { config } from '../../../config';

test('test', async ({ page }) => {
	await page.goto(config.adminUiUrl);
	await page.getByRole('link', { name: 'mikro-orm-sqlite' }).click();
	await page.getByRole('link', { name: 'InvoiceLine' }).click();
	await page.locator('.rdg-row > div:nth-child(3)').first().click();
	await page.getByLabel('quantity').click();
	await page.getByLabel('quantity').fill('3');
	await page.getByRole('button', { name: 'Save' }).click();
	await expect(await page.getByText('has been successfully updated.')).toBeVisible();
});
