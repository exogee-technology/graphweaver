import { ChartColorScheme } from '../../utils';

export interface LineChartItem {
	id: string;
	data: Array<{ x: string; y: number }>;
}

export interface LineChartControls {
	curve: 'linear' | 'basis' | 'cardinal' | 'catmullRom';
	colorScheme: ChartColorScheme;
	enableArea: boolean;
	enablePoints: boolean;
	enablePointLabel: boolean;
	enableGridX: boolean;
	enableGridY: boolean;
}

export const defaultLineChartControls: LineChartControls = {
	curve: 'linear',
	colorScheme: ChartColorScheme.nivo,
	enableArea: false,
	enablePoints: true,
	enablePointLabel: false,
	enableGridX: false,
	enableGridY: true,
};
