import { expect, test } from '@playwright/test';

import { config } from '../../../config';

test('Ensure people can be listed and that they have vehicles', async ({ page }) => {
	await page.goto(config.adminUiUrl);
	await page.getByRole('link', { name: 'REST (swapi.info)' }).click();
	await page.getByTestId('Person-entity-link').click();
	await expect(page.locator('tbody')).toContainText('Luke Skywalker');
	await expect(page.locator('tbody')).toContainText('19BBY');
	await expect(page.locator('tbody')).toContainText('Snowspeeder, Imperial Speeder Bike');
	await page.getByRole('cell', { name: 'Leia Organa' }).click();
	await expect(page.getByTestId('detail-panel-field-vehicles')).toContainText(
		'vehiclesImperial Speeder Bike'
	);
});

test('Ensure vehicles can be listed and that they have pilots', async ({ page }) => {
	await page.goto(config.adminUiUrl);
	await page.getByRole('link', { name: 'REST (swapi.info)' }).click();
	await page.getByTestId('Vehicle-entity-link').click();
	await expect(page.locator('tbody')).toContainText('Sand Crawler');
	await expect(page.locator('tbody')).toContainText('Snowspeeder');
	await expect(page.locator('tbody')).toContainText('Luke Skywalker, Wedge Antilles');
	await page.getByRole('cell', { name: 'Incom corporation', exact: true }).click();
	await expect(page.getByTestId('detail-panel-field-pilots')).toContainText(
		'pilots*Luke SkywalkerWedge Antilles'
	);
	await page.locator('._overlay_1slpl_1').click();
	await page.getByRole('cell', { name: 'AT-ST' }).click();
	await expect(page.getByTestId('detail-panel-field-pilots')).toContainText('pilots*Chewbacca');
});

test('Ensure people can be filtered', async ({ page }) => {
	await page.goto(config.adminUiUrl);
	await page.getByRole('link', { name: 'REST (swapi.info)' }).click();
	await page.getByTestId('Person-entity-link').click();
	await page.getByTestId('url-filter').getByRole('combobox').click();
	await page.getByRole('option', { name: '4', exact: true }).click();
	await page.waitForURL((url) => url.toString().includes('filters=eyJ1cmxfaW4iOlsiNCJdfQ%3D%3D'));
	await page.getByTestId('spinner').waitFor({ state: 'hidden' });

	// Only Darth Vader should be showing.
	await expect(await page.getByTestId('table').locator('tbody').locator('tr').count()).toBe(1);
	await expect(
		await page.getByTestId('table').locator('tbody').locator('tr').nth(0).textContent()
	).toBe('4Darth Vader202136none41.9BBY');

	await page.getByTestId('url-filter').getByRole('combobox').click();
	await page.getByRole('option', { name: '2', exact: true }).click();
	await page.waitForURL((url) => url.toString().includes('filters=eyJ1cmxfaW4iOlsiNCIsIjIiXX0%3D'));
	await page.getByTestId('spinner').waitFor({ state: 'hidden' });

	// Now Darth Vader and C-3PO should be showing.
	await expect(await page.getByTestId('table').locator('tbody').locator('tr').count()).toBe(2);
	await expect(
		await page.getByTestId('table').locator('tbody').locator('tr').nth(0).textContent()
	).toBe('2C-3PO16775n/a112BBY');
	await expect(
		await page.getByTestId('table').locator('tbody').locator('tr').nth(1).textContent()
	).toBe('4Darth Vader202136none41.9BBY');

	// Clear the filters, and we should be back to everyone.
	await page.getByRole('button', { name: 'Clear Filters' }).click();
	await page.waitForURL((url) => !url.toString().includes('filters'));
	await page.getByTestId('spinner').waitFor({ state: 'hidden' });
	await expect(await page.getByTestId('table').locator('tbody').locator('tr').count()).toBe(50);
});

test('Ensure vehicles can be filtered', async ({ page }) => {
	await page.goto(config.adminUiUrl);
	await page.getByRole('link', { name: 'REST (swapi.info)' }).click();
	await page.getByTestId('Vehicle-entity-link').click();
	await page.getByTestId('url-filter').getByRole('combobox').click();
	await page.getByRole('option', { name: '4', exact: true }).click();
	await page.waitForURL((url) => url.toString().includes('filters=eyJ1cmxfaW4iOlsiNCJdfQ%3D%3D'));
	await page.getByTestId('spinner').waitFor({ state: 'hidden' });

	// Only the Sand Crawler should be showing.
	await expect(await page.getByTestId('table').locator('tbody').locator('tr').count()).toBe(1);
	await expect(
		await page.getByTestId('table').locator('tbody').locator('tr').nth(0).textContent()
	).toBe('4Sand CrawlerDigger CrawlerCorellia Mining Corporation15000036.8 4630');

	await page.getByTestId('url-filter').getByRole('combobox').click();
	await page.getByRole('option', { name: '14', exact: true }).click();
	await page.waitForURL((url) => url.toString().includes('filters=eyJ1cmxfaW4iOlsiNCIsIjE0Il19'));
	await page.getByTestId('spinner').waitFor({ state: 'hidden' });

	// Now Sand Crawler and Snowspeeder should be showing.
	await expect(await page.getByTestId('table').locator('tbody').locator('tr').count()).toBe(2);
	await expect(
		await page.getByTestId('table').locator('tbody').locator('tr').nth(0).textContent()
	).toBe('4Sand CrawlerDigger CrawlerCorellia Mining Corporation15000036.8 4630');
	await expect(
		await page.getByTestId('table').locator('tbody').locator('tr').nth(1).textContent()
	).toBe('14Snowspeedert-47 airspeederIncom corporationunknown4.520Luke Skywalker, Wedge Antilles');

	// Clear the filters, and we should be back to all vehicles.
	await page.getByRole('button', { name: 'Clear Filters' }).click();
	await page.waitForURL((url) => !url.toString().includes('filters'));
	await page.getByTestId('spinner').waitFor({ state: 'hidden' });
	await expect(await page.getByTestId('table').locator('tbody').locator('tr').count()).toBe(39);
});
