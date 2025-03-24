import { DateTime } from 'luxon';
import { DateSlot, EmployeeId, TotalSales } from '../utils';
import { SalesPerEmployeeQuery } from './graphql.generated';
import { LineChartItem } from '../line-chart/utils';
import { BarChartItem } from '../bar-chart/utils';

export const getDates = (dateSlots: Set<DateSlot>): DateTime[] => {
	const dates = Array.from(dateSlots).map((dateSlot) => DateTime.fromFormat(dateSlot, 'yyyy-MM'));
	dates.sort((a, b) => a.toMillis() - b.toMillis());
	return dates;
};

export const plotLineData = (
	salesPerEmployeeId: Map<EmployeeId, Map<DateSlot, TotalSales>>,
	dates: DateTime[]
): LineChartItem[] => {
	const lineData: LineChartItem[] = [];
	salesPerEmployeeId.forEach((data, employeeId) => {
		const employeeData: LineChartItem = {
			id: employeeId,
			data: dates.map((date) => {
				const dateSlot = date.toFormat('yyyy-MM');
				const total = data.get(dateSlot) ?? 0;
				return { x: dateSlot, y: Math.floor(total * 100) / 100 };
			}),
		};
		lineData.push(employeeData);
	});

	return lineData;
};

export const plotBarData = (
	salesPerEmployeeId: Map<EmployeeId, Map<DateSlot, TotalSales>>,
	dates: DateTime[]
): BarChartItem[] => {
	const barData: BarChartItem[] = [];

	dates.forEach((date) => {
		const dateSlot = date.toFormat('yyyy-MM');
		const item: BarChartItem = { date: dateSlot };
		salesPerEmployeeId.forEach((salesPerDateSlot, employeeId) => {
			const total = salesPerDateSlot.get(dateSlot) ?? 0;
			item[employeeId] = Math.floor(total * 100) / 100;
		});
		barData.push(item);
	});

	return barData;
};
