import { test, expect } from '@playwright/test';
import { randomUUID } from 'crypto';

import { config } from '../../../config';

test('should allow an admin to delete a tag', async ({ page }) => {
	const tag = randomUUID();
	await page.goto(config.adminUiUrl);
	await page.getByPlaceholder('Username').click();
	await page.getByPlaceholder('Username').fill('darth');
	await page.getByPlaceholder('Password').click();
	await page.getByPlaceholder('Password').fill('deathstar123');
	await page.getByPlaceholder('Password').press('Enter');
	await page.getByRole('link', { name: 'mikro-orm-my-sql' }).click();
	await page.getByRole('link', { name: 'Tag' }).click();
	await page.getByRole('button', { name: 'Create New Tag' }).click();
	await page.getByLabel('name').click();
	await page.getByLabel('name').fill(tag);
	await page.getByRole('button', { name: 'Save' }).click();
	const element = await page.getByText('has been successfully created');
	await expect(element).toHaveCount(1);

	await page.getByRole('row', { name: tag }).locator('label div').click();
	await page.getByRole('button', { name: 'Actions' }).click();
	await page.getByText('Delete selected rows').click();
	await page.getByRole('button', { name: 'Delete' }).click();
	// Wait for the delete to complete
	const deleteToast = await page.getByText('rows deleted');
	await expect(deleteToast).toHaveCount(1);

	// Check that the item is removed from the table
	const tableElement = await page.getByRole('gridcell', { name: tag });
	await expect(tableElement).toHaveCount(0);
});
