import { test, expect } from '@playwright/test';

test('Expect deleting from grid to remove the album', async ({ page }) => {
	await page.goto('http://localhost:9000/');
	await page.getByRole('link', { name: 'mikro-orm-sqlite' }).click();
	// Select the playlist as has no foreign key constraints
	await page.getByRole('link', { name: 'Playlist' }).click();
	await page.getByRole('row', { name: 'Select 2 Movies' }).locator('label div').click();
	await page.getByRole('button', { name: 'Actions' }).click();
	await page.getByText('Delete selected rows').click();
	await page.getByRole('button', { name: 'Delete' }).click();
	// Wait for the delete to complete
	await page.waitForSelector('text=Select 2 Movies', { state: 'detached' });
	// expect that row to be gone
	expect(page.locator('text=Select 2 Movies').count()).toBe(0);

	// Now handle the error case
	await page.goto('http://localhost:9000/Album');
	await page
		.getByRole('row', {
			name: "Select 4 Let There Be Rock AC/DC Go Down, Dog Eat Dog, Let There Be Rock, Bad Boy Boogie, Problem Child, Overdose, Hell Ain't A Bad Place To Be, Whole Lotta Rosie",
		})
		.locator('label div')
		.click();
	await page.getByRole('button', { name: 'Actions' }).click();
	await page.getByText('Delete selected rows').click();
	await page.getByRole('button', { name: 'Delete' }).click();
	// Expect the row to still be there
	expect(
		page
			.getByRole('row', {
				name: "Select 4 Let There Be Rock AC/DC Go Down, Dog Eat Dog, Let There Be Rock, Bad Boy Boogie, Problem Child, Overdose, Hell Ain't A Bad Place To Be, Whole Lotta Rosie",
			})
			.locator('label div')
			.count()
	).toBe(1);
});
