import { test, expect } from '@playwright/test';
import { config } from '../../../config';
import { randomUUID } from 'crypto';

test('should allow an admin to create a user', async ({ page }) => {
	const username = randomUUID();
	await page.goto(config.adminUiUrl);
	await page.getByPlaceholder('Username').click();
	await page.getByPlaceholder('Username').fill('darth');
	await page.getByPlaceholder('Password').click();
	await page.getByPlaceholder('Password').fill('deathstar123');
	await page.getByPlaceholder('Password').press('Enter');

	// Close the welcome page
	await page.getByRole('button', { name: 'Get started!' }).click();

	await page.getByRole('link', { name: 'mikro-orm-my-sql' }).click();
	await page.getByRole('link', { name: 'Credential' }).click();
	await page.getByRole('button', { name: 'Create New Credential' }).click();
	await page.getByLabel('username').click();
	await page.getByLabel('username').fill(username);
	await page.getByPlaceholder('Password').click();
	await page.getByPlaceholder('Password').fill('test1234');
	await page.getByPlaceholder('Confirm').click();
	await page.getByPlaceholder('Confirm').fill('test1234');
	await page.getByRole('button', { name: 'Save' }).click();
	const element = await page.getByText('has been successfully created');
	await expect(element).toHaveCount(1);

	// Check that the created item is in the table
	const tableElement = await page.getByRole('cell', { name: username });
	await expect(tableElement).toHaveCount(1);
});

test('should not allow a non-admin to create a user', async ({ page }) => {
	await page.goto(config.adminUiUrl);
	await page.getByPlaceholder('Username').click();
	await page.getByPlaceholder('Username').fill('luke');
	await page.getByPlaceholder('Username').press('Tab');
	await page.getByPlaceholder('Password').fill('lightsaber123');
	await page.getByPlaceholder('Password').press('Enter');

	// Close the welcome page
	await page.getByRole('button', { name: 'Get started!' }).click();

	await page.getByRole('link', { name: 'mikro-orm-my-sql' }).click();
	await page.getByRole('link', { name: 'Credential' }).click();
	await page.getByRole('button', { name: 'Create New Credential' }).click();
	await page.getByLabel('username').click();
	await page.getByLabel('username').fill('test_test');
	await page.getByLabel('username').press('Tab');
	await page.getByPlaceholder('Password').fill('test1234');
	await page.getByPlaceholder('Password').press('Tab');
	await page.getByPlaceholder('Confirm').fill('test1234');
	await page.getByRole('button', { name: 'Save' }).click();
	const element = await page.getByText(
		'Permission Denied: You do not have permission to create credentials'
	);
	await expect(element).toHaveCount(1);
});
