import { ChartColorScheme } from '../utils';
import { GenrePopularityQuery } from './graphql.generated';

interface PieDataItem {
	id: string;
	label: string;
	value: number;
}

type GenreId = string;

export const getPieData = (data: GenrePopularityQuery) => {
	const pieDataMap: Map<GenreId, PieDataItem> = new Map();
	data?.genres?.forEach((genre) => {
		genre.tracks?.forEach((track) => {
			track.invoiceLines?.forEach((invoiceLine) => {
				const genreId = genre.genreId;
				const pieDataItem = pieDataMap.get(genreId);
				const quantity = invoiceLine.quantity ?? 0;
				if (pieDataItem) {
					pieDataItem.value += quantity;
				} else {
					pieDataMap.set(genreId, {
						id: genreId,
						label: genre.name ?? genreId,
						value: quantity,
					});
				}
			});
		});
	});

	return Array.from(pieDataMap.values());
};

export interface PieChartControls {
	colorScheme: ChartColorScheme;

	/** Number between -180 and 360 */
	angle: number;

	/** number between 0 and 0.95 */
	innerRadius: number;

	/** number between 0 and 45 */
	padAngle: number;

	/** number between 0 and 45 */
	cornerRadius: number;
	sortByValue: boolean;
	enableArcLabels: boolean;
	enableArcLinkLabels: boolean;
}

export const defaultPieChartControls: PieChartControls = {
	colorScheme: ChartColorScheme.purples,
	angle: 0,
	innerRadius: 0.5,
	padAngle: 0.7,
	cornerRadius: 3,
	sortByValue: true,
	enableArcLabels: true,
	enableArcLinkLabels: true,
};
