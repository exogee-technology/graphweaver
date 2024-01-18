import { test, expect } from '@playwright/test';
import { config } from '../../../config';

test('should allow an admin to update a user', async ({ page }) => {
	await page.goto(config.adminUiUrl);
	await page.getByPlaceholder('Username').click();
	await page.getByPlaceholder('Username').fill('darth');
	await page.getByPlaceholder('Username').press('Tab');
	await page.getByPlaceholder('Password').fill('deathstar123');
	await page.getByPlaceholder('Password').press('Enter');
	await page.getByRole('link', { name: 'mikro-orm-my-sql' }).click();
	await page.getByRole('link', { name: 'Credential' }).click();
	await page.getByRole('gridcell', { name: 'darth' }).click();
	await page.getByPlaceholder('Password').click();
	await page.getByPlaceholder('Password').fill('deathstar123');
	await page.getByPlaceholder('Confirm').click();
	await page.getByPlaceholder('Confirm').fill('deathstar123');
	await page.getByRole('button', { name: 'Save' }).click();
	expect(await page.getByText('Item 4 darth has been successfully updated.')).toBeTruthy();
});

test('should allow a non-admin to update themselves', async ({ page }) => {
	await page.goto(config.adminUiUrl);
	await page.getByPlaceholder('Username').click();
	await page.getByPlaceholder('Username').fill('luke');
	await page.getByPlaceholder('Username').press('Tab');
	await page.getByPlaceholder('Password').fill('lightsaber123');
	await page.getByPlaceholder('Password').press('Enter');
	await page.getByRole('link', { name: 'mikro-orm-my-sql' }).click();
	await page.getByRole('link', { name: 'Credential' }).click();
	await page.getByRole('gridcell', { name: 'luke' }).click();
	await page.getByPlaceholder('Password').click();
	await page.getByPlaceholder('Password').fill('lightsaber123');
	await page.getByPlaceholder('Confirm').click();
	await page.getByPlaceholder('Confirm').fill('lightsaber123');
	await page.getByRole('button', { name: 'Save' }).click();
	expect(await page.getByText('Item 1 luke has been successfully updated.')).toBeTruthy();
});

test('should deny a non-admin to update another user', async ({ page }) => {
	await page.goto(config.adminUiUrl);
	await page.getByPlaceholder('Username').click();
	await page.getByPlaceholder('Username').fill('luke');
	await page.getByPlaceholder('Username').press('Tab');
	await page.getByPlaceholder('Password').fill('lightsaber123');
	await page.getByPlaceholder('Password').press('Enter');
	// Load another user's page
	await page.goto(`${config.adminUiUrl}/Credential/4`);
	expect(await page.getByText('Failed to load entity.')).toBeTruthy();
});
