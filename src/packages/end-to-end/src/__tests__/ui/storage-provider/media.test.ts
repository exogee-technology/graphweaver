import { test, expect } from '@playwright/test';
import path from 'path';

import { config } from '../../../config';

test('Ensure media is uploaded on create', async ({ page }) => {
	await page.goto(`${config.adminUiUrl}/Submission`);
	await page.getByRole('button', { name: 'Create New Submission' }).click();
	await page.waitForTimeout(1000);

	const fileChooserPromise = page.waitForEvent('filechooser');
	await page.locator('input[type="file"]').click();
	const fileChooser = await fileChooserPromise;
	await fileChooser.setFiles(path.join(__dirname, './fixtures/pickle.png'));

	await page.getByRole('button', { name: 'Save' }).click();
	await expect(await page.getByText('has been successfully created.')).toBeVisible();
});

test('Ensure media is uploaded on update', async ({ page }) => {
	await page.goto(`${config.adminUiUrl}/Submission`);
	await page.getByRole('cell').last().click();
	await page.waitForTimeout(1000);

	const fileChooserPromise = page.waitForEvent('filechooser');
	await page.locator('input[type="file"]').click();
	const fileChooser = await fileChooserPromise;
	await fileChooser.setFiles(path.join(__dirname, './fixtures/tomato-chair.png'));

	await page.getByRole('button', { name: 'Save' }).click();
	await expect(await page.getByText('has been successfully updated.')).toBeVisible();
});

test('Ensure media is deleted', async ({ page }) => {
	await page.goto(`${config.adminUiUrl}/Submission`);

	await page.getByRole('cell').getByRole('img').last().click();
	await page.waitForTimeout(1000);

	await page.getByRole('button', { name: 'Delete' }).click();

	await page.getByRole('button', { name: 'Save' }).click();
	await expect(await page.getByText('has been successfully updated.')).toBeVisible();
});
