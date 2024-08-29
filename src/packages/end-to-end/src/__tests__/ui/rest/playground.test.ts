import { test, expect } from '@playwright/test';

import { config } from '../../../config';

test('Ensure users can navigate to the playground and execute a query', async ({ page }) => {
	await page.goto(config.adminUiUrl);
	await page.goto('http://localhost:9000/');
	await page.getByRole('link', { name: 'REST (swapi.info)' }).click();
	await page.getByTestId('Person-entity-link').click();
	const page1Promise = page.waitForEvent('popup');
	await page.getByRole('button', { name: 'Open Playground' }).click();
	const page1 = await page1Promise;
	await page1.locator('.CodeMirror-lines').first().click();
	await page1.getByLabel('Query Editor').getByRole('textbox').press('ControlOrMeta+a');
	await page1.getByLabel('Query Editor').getByRole('textbox').fill(`
		query {
			person(id: 1) {
				name
				vehicles {
					name
				}
			}
		}`);

	await page1.getByLabel('Execute query (Ctrl-Enter)').click();
	await page1.locator('div.graphiql-spinner').isHidden();
	await expect(page1.getByLabel('Result Window')).toContainText(
		'x { "data": { "person": { "name": "Luke Skywalker", "vehicles": [ { "name": "Snowspeeder" }, { "name": "Imperial Speeder Bike" } ] } }}'
	);
});

test('Ensure users can navigate to the playground and execute a query with pagination parameters', async ({
	page,
}) => {
	await page.goto(config.adminUiUrl);
	await page.goto('http://localhost:9000/');
	await page.getByRole('link', { name: 'REST (swapi.info)' }).click();
	await page.getByTestId('Person-entity-link').click();
	const page1Promise = page.waitForEvent('popup');
	await page.getByRole('button', { name: 'Open Playground' }).click();
	const page1 = await page1Promise;
	await page1.locator('.CodeMirror-lines').first().click();
	await page1.getByLabel('Query Editor').getByRole('textbox').press('ControlOrMeta+a');
	await page1.getByLabel('Query Editor').getByRole('textbox').fill(`
		query {
			people(pagination: { offset: 4, limit: 2 }) {
				name
				vehicles {
					name
				}
			}
		}`);
	await page1.getByLabel('Execute query (Ctrl-Enter)').click();
	await page1.locator('div.graphiql-spinner').isHidden();
	await expect(page1.getByLabel('Result Window')).toContainText(
		'x { "data": { "people": [ { "name": "Leia Organa", "vehicles": [ { "name": "Imperial Speeder Bike" } ] }, { "name": "Owen Lars", "vehicles": [] } ] }}'
	);
});
