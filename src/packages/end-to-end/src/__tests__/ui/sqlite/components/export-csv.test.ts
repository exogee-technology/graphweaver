import { Download, expect, test } from '@playwright/test';
import { parse } from 'csv-parse/sync';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import path from 'path';
import { config } from '../../../../config';
import { bodyHasText } from '../../../../utils';

export const DOWNLOAD_PATH = path.join('.downloads/');

export const saveDownload = async (
	download: Download,
	options?: {
		filename?: string;
	}
) => {
	if (!existsSync(DOWNLOAD_PATH)) {
		mkdirSync(DOWNLOAD_PATH);
	}
	const dlPath = path.join(DOWNLOAD_PATH, options?.filename ?? download.suggestedFilename());
	await download.saveAs(dlPath);
	const data = readFileSync(dlPath, { encoding: 'utf-8' });
	return data;
};

test('Export CSV with nested entities', async ({ page }) => {
	await page.goto(config.adminUiUrl);
	await page.getByRole('link', { name: 'Album' }).click();

	// Filter for an artist
	await page.getByTestId('artist-filter-input').click();
	await page.locator('li').getByText('AC/DC').click({ delay: 1000 });
	await page.waitForResponse(bodyHasText('Let There Be Rock'));

	const exportEvent = page.waitForEvent('download');
	await page.getByRole('button', { name: 'Export to CSV' }).click();

	const csvRaw = await saveDownload(await exportEvent, { filename: 'albums-export.csv' });
	const csv = parse(csvRaw, { columns: true });
	expect(csv).toEqual(
		expect.arrayContaining([
			expect.objectContaining({
				albumId: '1',
				artist: 'AC/DC',
				title: 'For Those About To Rock We Salute You',
				tracks: `For Those About To Rock (We Salute You), Put The Finger On You, Let's Get It Up, Inject The Venom, Snowballed, Evil Walks, C.O.D., Breaking The Rules, Night Of The Long Knives, Spellbound, "40"`,
			}),
			expect.objectContaining({
				albumId: '4',
				artist: 'AC/DC',
				title: 'Let There Be Rock',
				tracks: `Go Down, Dog Eat Dog, Let There Be Rock, Bad Boy Boogie, Problem Child, Overdose, Hell Ain't A Bad Place To Be, Whole Lotta Rosie`,
			}),
		])
	);
});
