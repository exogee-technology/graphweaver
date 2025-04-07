import { expect, test } from '@playwright/test';
import { config } from '../../../../config';

const invoiceAdminUrl = `${config.adminUiUrl}/Invoice`;

[
	{
		locale: 'en-US',
		timezoneId: 'America/New_York',
		expectedCount: 7,
		expectedFrom: 'Thursday, October 1st, 2009',
	},
	{
		locale: 'en-AU',
		timezoneId: 'Australia/Sydney',
		expectedCount: 1,
		expectedFrom: 'Saturday, January 10th, 2009',
	},
].forEach(({ locale, timezoneId, expectedCount, expectedFrom }) => {
	// The describe block stops test.use from affecting the rest of the tests in the file
	test.describe(`Date picker tests: ${locale}`, () => {
		test.use({ locale, timezoneId });
		test(`Local (${locale}) dates interpreted in correct format`, async ({ page }) => {
			await page.goto(invoiceAdminUrl);

			await page.getByPlaceholder('invoiceDate').click();
			await page.getByPlaceholder('invoiceDate').fill('10/01/2009 to 11/01/2009');
			await page.getByRole('button', { name: 'Done' }).click();
			await page.getByPlaceholder('invoiceId').click();

			// Account for header and footer row
			const totalRows = expectedCount + 2;
			await expect(page.getByRole('table').getByRole('row')).toHaveCount(totalRows);

			// Open the modal
			await page.getByPlaceholder('invoiceDate').click();
			await expect(page.getByRole('button', { name: `${expectedFrom}, selected` })).toBeVisible();
		});
	});
});

test.describe('Date picker with time', () => {
	// The date range in this test covers the switch between AEST and AEDT,
	// which was causing a bug in development
	test.use({ timezoneId: 'Australia/Sydney', locale: 'en-AU' });
	test('Values in time inputs get preserved', async ({ page }) => {
		await page.goto(invoiceAdminUrl);

		await page.getByPlaceholder('invoiceDate').click();
		await page.getByPlaceholder('invoiceDate').fill('04/04/2025 to 05/04/2025');

		await page.getByLabel('From').fill('08:30:00');
		await page.getByLabel('To', { exact: true }).fill('22:20:00');

		await page.getByPlaceholder('invoiceDate').fill('04/04/2025 to 06/04/2025');

		await expect(page.getByLabel('From')).toHaveValue('08:30:00');
		await expect(page.getByLabel('To', { exact: true })).toHaveValue('22:20:00');
	});
});

test('Filter with ISO Date strings (YYYY-MM-DD)', async ({ page }) => {
	await page.goto(invoiceAdminUrl);

	await page.getByPlaceholder('invoiceDate').click();
	await page.getByPlaceholder('invoiceDate').fill('2009-01-10 to 2009-01-11');
	await page.getByRole('button', { name: 'Done' }).click();

	// The format should stay in YYYY-MM-DD
	await expect(page.getByPlaceholder('invoiceDate')).toHaveValue('2009-01-10 to 2009-01-11');

	await page.getByPlaceholder('invoiceDate').click();
	await expect(
		page.getByRole('button', { name: 'Saturday, January 10th, 2009, selected' })
	).toBeVisible();
});

test('Ignore bad dates', async ({ page }) => {
	await page.goto(invoiceAdminUrl);

	await page.getByPlaceholder('invoiceDate').click();
	await page.getByPlaceholder('invoiceDate').fill('13/13/2013 to 42/42/2042');
	await page.getByRole('button', { name: 'Done' }).click();

	// Invalid input should be cleared
	await expect(page.getByPlaceholder('invoiceDate')).toBeEmpty();
});
