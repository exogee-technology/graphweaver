import { test, expect } from '@playwright/test';
import { config } from '../../../config';

test('should allow a successful login', async ({ page }) => {
	await page.goto(config.adminUiUrl);

	await page.getByPlaceholder('Username').click();
	await page.getByPlaceholder('Username').fill('darth');
	await page.getByPlaceholder('Password').click();
	await page.getByPlaceholder('Password').fill('deathstar123');
	await page.getByRole('button', { name: 'Login' }).click();
	await expect(page.getByRole('link', { name: 'mikro-orm-my' })).toBeVisible();
});
