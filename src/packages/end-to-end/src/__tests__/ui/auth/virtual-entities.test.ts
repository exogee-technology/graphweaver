import { test, expect } from '@playwright/test';
import { config } from '../../../config';

test('should show virtual entities', async ({ page }) => {
	await page.goto(config.adminUiUrl);

	// login
	await page.getByPlaceholder('Username').click();
	await page.getByPlaceholder('Username').fill('darth');
	await page.getByPlaceholder('Password').click();
	await page.getByPlaceholder('Password').fill('deathstar123');
	await page.getByRole('button', { name: 'Login' }).click();

	// Close the welcome page
	await page.getByRole('button', { name: 'Get started!' }).click();

	// navigate to the grid page
	await page.getByRole('link', { name: 'mikro-orm-my-sql' }).click();
	await page.getByTestId('TaskCountByTag-entity-link').click();

	expect(await page.getByRole('row').nth(1).getByRole('cell').nth(2).innerText()).toBe('urgent');
	expect(await page.getByRole('row').nth(1).getByRole('cell').nth(3).innerText()).toBe('3');
	expect(await page.getByRole('row').nth(2).getByRole('cell').nth(2).innerText()).toBe(
		'waiting-for-decision'
	);
	expect(await page.getByRole('row').nth(2).getByRole('cell').nth(3).innerText()).toBe('2');

	expect(await page.getByRole('row').count()).toBe(4);
});
