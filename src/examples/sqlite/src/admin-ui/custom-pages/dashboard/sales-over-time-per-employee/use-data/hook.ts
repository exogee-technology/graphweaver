import { useMemo } from 'react';
import { DateTime } from 'luxon';
import { useSalesPerEmployeeQuery } from './graphql.generated';
import { DateSlot, EmployeeId, TotalSales } from '../utils';
import { getDates, plotBarData, plotLineData } from './utils';

export const useData = () => {
	const { data: queryData, loading, error } = useSalesPerEmployeeQuery();
	const { dates, lineData, barData, employeeIds } = useMemo(() => {
		const dateSlots: Set<DateSlot> = new Set();
		const salesPerEmployeeId = new Map<EmployeeId, Map<DateSlot, TotalSales>>();
		const employeeIds: EmployeeId[] = [];
		queryData?.employees?.forEach((employee) => {
			const employeeId = `${employee.firstName} ${employee.lastName} - id:${employee.employeeId}`;
			employeeIds.push(employeeId);
			employee.customers.forEach((customer) => {
				customer.invoices.forEach((invoice) => {
					const total = parseFloat(invoice.total);
					const date = DateTime.fromISO(invoice.invoiceDate);
					// too many days, let's group by month
					const dateSlot = date.toFormat('yyyy-MM');
					dateSlots.add(dateSlot);
					const totalByDateSlot =
						salesPerEmployeeId.get(employeeId) ?? new Map<DateSlot, TotalSales>();
					const currentTotal = totalByDateSlot.get(dateSlot) ?? 0;
					totalByDateSlot.set(dateSlot, currentTotal + total);
					salesPerEmployeeId.set(employeeId, totalByDateSlot);
				});
			});
		});

		const dates = getDates(dateSlots);
		const lineData = plotLineData(salesPerEmployeeId, dates);
		const barData = plotBarData(salesPerEmployeeId, dates);

		return { dates, lineData, barData, employeeIds };
	}, [queryData]);

	return { dates, lineData, barData, employeeIds, loading, error };
};
