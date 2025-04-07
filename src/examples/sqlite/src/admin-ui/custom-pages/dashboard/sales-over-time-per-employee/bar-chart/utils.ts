import { ChartColorScheme } from '../../utils';
import { DateSlot, EmployeeId, TotalSales } from '../utils';

/**
 * Sales per employee per month.
 * Something like:
 * {
 * 		date: '2025-01',
 * 		'employee-1': 10340,
 * 		'employee-2': 20500
 * }
 */
export type BarChartItem = Record<'date' | EmployeeId, DateSlot | TotalSales>;

export interface BarChartControls {
	colorScheme: ChartColorScheme;
	reverse: boolean;
	enableLabel: boolean;
	enableTotals: boolean;
	enableGridX: boolean;
	enableGridY: boolean;
}

export const defaultBarChartControls: BarChartControls = {
	colorScheme: ChartColorScheme.purples,
	reverse: false,
	enableLabel: true,
	enableTotals: true,
	enableGridX: false,
	enableGridY: true,
};
