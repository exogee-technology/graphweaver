import { test, expect } from '@playwright/test';
import { config } from '../../../config';

test('List Trace Page', async ({ page }) => {
	await page.goto(config.adminUiUrl);
	await page.getByPlaceholder('Username').click();
	await page.getByPlaceholder('Username').fill('darth');
	await page.getByPlaceholder('Username').press('Tab');
	await page.getByPlaceholder('Password').fill('deathstar123');
	await page.getByPlaceholder('Password').press('Enter');

	// Close the welcome page
	await page.getByRole('button', { name: 'Get started!' }).click();

	await page.getByRole('link', { name: 'Trace' }).click();

	await expect(page.getByRole('heading', { name: 'Trace' })).toBeVisible();

	await page.getByRole('link', { name: 'mikro-orm-my-sql' }).click();
	await page.getByRole('link', { name: 'Tag' }).click();
	await page.getByRole('link', { name: 'Task' }).click();

	await page.getByRole('link', { name: 'Trace' }).click();
	await page.reload();

	await expect(page.getByRole('heading', { name: 'Trace' })).toBeVisible();

	await page.getByRole('cell', { name: 'TasksList' }).first().click();

	await page.getByRole('button', { name: 'TasksList' }).click();
	await page.getByRole('button', { name: 'Rest - find' }).click();

	await expect(await page.getByText('Detailed trace view for')).toBeVisible();
	await expect(page).toHaveURL(new RegExp(`^.*/Trace/.*`));
});
