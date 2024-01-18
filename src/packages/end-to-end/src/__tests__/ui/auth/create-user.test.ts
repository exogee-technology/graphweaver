import { test, expect } from '@playwright/test';
import { config } from '../../../config';

test('should allow an admin to create a user', async ({ page }) => {
	await page.goto(config.adminUiUrl);
	await page.getByPlaceholder('Username').click();
	await page.getByPlaceholder('Username').fill('darth');
	await page.getByPlaceholder('Password').click();
	await page.getByPlaceholder('Password').fill('deathstar123');
	await page.getByPlaceholder('Password').press('Enter');
	await page.getByRole('link', { name: 'mikro-orm-my-sql' }).click();
	await page.getByRole('link', { name: 'Credential' }).click();
	await page.getByRole('button', { name: 'Create New Credential' }).click();
	await page.getByLabel('username').click();
	await page.getByLabel('username').fill('test_test');
	await page.getByPlaceholder('Password').click();
	await page.getByPlaceholder('Password').fill('test123');
	await page.getByPlaceholder('Confirm').click();
	await page.getByPlaceholder('Confirm').fill('test123');
	await page.getByRole('button', { name: 'Save' }).click();
	expect(await page.getByText('text=test_test has been successfully created.')).toBeTruthy();
});

test('should not allow a non-admin to create a user', async ({ page }) => {
	await page.goto(config.adminUiUrl);
	await page.getByPlaceholder('Username').click();
	await page.getByPlaceholder('Username').fill('luke');
	await page.getByPlaceholder('Username').press('Tab');
	await page.getByPlaceholder('Password').fill('lightsaber123');
	await page.getByPlaceholder('Password').press('Enter');
	await page.getByRole('link', { name: 'mikro-orm-my-sql' }).click();
	await page.getByRole('link', { name: 'Credential' }).click();
	await page.getByRole('button', { name: 'Create New Credential' }).click();
	await page.getByLabel('username').click();
	await page.getByLabel('username').fill('test_test');
	await page.getByLabel('username').press('Tab');
	await page.getByPlaceholder('Password').fill('test123');
	await page.getByPlaceholder('Password').press('Tab');
	await page.getByPlaceholder('Confirm').fill('test123');
	await page.getByRole('button', { name: 'Save' }).click();
	expect(await page.getByText('text=Create unsuccessful: Failed to save credential.')).toBeTruthy();
});
