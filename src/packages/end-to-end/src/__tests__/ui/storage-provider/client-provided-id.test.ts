import { expect, test } from '@playwright/test';
import path from 'path';

import { config } from '../../../config';

test('Ensure a new image note can be created when an ID is provided', async ({ page }) => {
	// Create a submission
	await page.goto(`${config.adminUiUrl}/Submission`);
	await page.getByRole('button', { name: 'Create New Submission' }).click();
	await page.waitForTimeout(1000);

	const fileChooserPromise = page.waitForEvent('filechooser');
	await page.locator('input[type="file"]').click();
	const fileChooser = await fileChooserPromise;
	await fileChooser.setFiles(path.join(__dirname, './fixtures/pickle.png'));

	await page.getByRole('button', { name: 'Save' }).click();
	await expect(await page.getByText('has been successfully created.')).toBeVisible();

	// get ID from the submission
	const table = await page.getByTestId('table');
	const submissionId = await table.locator('tbody tr td:nth-child(2)').first().innerText();

	expect(submissionId).not.toBeNull();

	// Create note for that submission
	await page.goto(`${config.adminUiUrl}/ImageNote`);
	await page.getByRole('button', { name: 'Create New ImageNote' }).click();
	await page.waitForTimeout(1000);

	await page.getByLabel('note*').fill('This is a note');

	await page.getByLabel('id').click();
	await page.getByLabel('id').fill('8a8e1d03-6024-4163-ae73-9d369f9e2922');

	await page.getByTestId('detail-panel-field-submission').getByRole('combobox').click();
	await page.getByRole('option', { name: submissionId, exact: true }).click();

	await page.getByRole('button', { name: 'Save' }).click();
	await expect(page.getByText('has been successfully created.')).toBeVisible();
});

// Field "id" of required type "ID!" was not provided
test('Ensure a new image note cannot be created when an ID is not provided', async ({ page }) => {
	// Create a submission
	await page.goto(`${config.adminUiUrl}/Submission`);
	await page.getByRole('button', { name: 'Create New Submission' }).click();
	await page.waitForTimeout(1000);

	const fileChooserPromise = page.waitForEvent('filechooser');
	await page.locator('input[type="file"]').click();
	const fileChooser = await fileChooserPromise;
	await fileChooser.setFiles(path.join(__dirname, './fixtures/pickle.png'));

	await page.getByRole('button', { name: 'Save' }).click();
	await expect(await page.getByText('has been successfully created.')).toBeVisible();

	// get ID from the submission
	const table = page.getByTestId('table');
	const submissionId = await table.locator('tbody tr td:nth-child(2)').first().innerText();

	expect(submissionId).not.toBeNull();

	// Create note for that submission
	await page.goto(`${config.adminUiUrl}/ImageNote`);
	await page.getByRole('button', { name: 'Create New ImageNote' }).click();
	await page.waitForTimeout(1000);

	await page.getByLabel('note*').fill('This is a note');

	await page.getByTestId('detail-panel-field-submission').getByRole('combobox').click();
	await page.getByRole('option', { name: submissionId, exact: true }).click();

	await page.getByRole('button', { name: 'Save' }).click();
	await expect(page.getByText('Field "id" of required type "ID!" was not provided')).toBeVisible();

	const element = page.getByText('Field "id" of required type "ID!" was not provided');
	await expect(element).toHaveCount(1);
});
