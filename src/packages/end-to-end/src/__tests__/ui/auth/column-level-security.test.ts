import { test, expect } from '@playwright/test';
import { config } from '../../../config';

test('should allow to see the priority column', async ({ page }) => {
	await page.goto(config.adminUiUrl);

	await page.getByPlaceholder('Username').click();
	await page.getByPlaceholder('Username').fill('darth');
	await page.getByPlaceholder('Password').click();
	await page.getByPlaceholder('Password').fill('deathstar123');
	await page.getByRole('button', { name: 'Login' }).click();

	// Close the welcome page
	await page.getByRole('button', { name: 'Get started!' }).click();

	await page.getByRole('link', { name: 'mikro-orm-my-sql' }).click();
	await page.getByRole('link', { name: 'Task', exact: true }).click();

	await expect(await page.getByText('priority')).toBeVisible();
});

test('should not allow to see the priority column', async ({ page }) => {
	await page.goto(config.adminUiUrl);

	await page.getByPlaceholder('Username').click();
	await page.getByPlaceholder('Username').fill('luke');
	await page.getByPlaceholder('Password').click();
	await page.getByPlaceholder('Password').fill('lightsaber123');
	await page.getByRole('button', { name: 'Login' }).click();

	// Close the welcome page
	await page.getByRole('button', { name: 'Get started!' }).click();

	await page.getByRole('link', { name: 'mikro-orm-my-sql' }).click();
	await page.getByRole('link', { name: 'Task', exact: true }).click();

	await expect(await page.getByText('priority')).not.toBeVisible();
});
