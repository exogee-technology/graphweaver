import { test, expect } from '@playwright/test';
import { config } from '../../../config';
import { randomUUID } from 'crypto';

test('should error if password is not strong enough', async ({ page }) => {
	const username = randomUUID();
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
	await page.getByLabel('username').fill(username);
	await page.getByPlaceholder('Password').click();
	await page.getByPlaceholder('Password').fill('test123');
	await page.getByPlaceholder('Confirm').click();
	await page.getByPlaceholder('Confirm').fill('test123');
	await page.getByRole('button', { name: 'Save' }).click();
	const element = await page.getByText('Password not strong enough.');
	await expect(element).toHaveCount(1);
});
