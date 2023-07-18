import { ResponsiveLine } from '@nivo/line';
import React from 'react';
import { useParams } from 'react-router-dom';
import { gql } from '@apollo/client';
import { Loader } from '@exogee/graphweaver-admin-ui-components';

import { theme } from '../theme';
import styles from './styles.module.css';
import { tooltip } from './tooltip';
import { useProfitAndLossRowsQuery } from './component.generated';

const categories = ['Net Profit', 'Total Operating Expenses', 'Gross Profit'];

gql`
	query profitAndLossRows($tenantId: ID!) {
		profitAndLossRows(filter: { tenantId: $tenantId }) {
			amount
			date
			description
			account {
				name
				type
			}
		}
	}
`;

export const SingleCompany = () => {
	const { tenantId } = useParams();

	const { data, loading, error } = useProfitAndLossRowsQuery({
		variables: { tenantId },
	});

	if (loading) return <Loader />;
	if (error) return <p>Error loading report rows!</p>;

	const rows = data.profitAndLossRows;
	const chartValues = categories.map((category) => ({
		id: category,
		data: rows
			.filter((row) => row.description === category)
			.map((row) => ({ x: new Date(row.date), y: row.amount })),
	}));
	const netProfitRows = rows.filter((row) => row.description === 'Net Profit');

	return (
		<div className={styles.wrapper}>
			<div className={styles.reportSection}>
				<h2 className={styles.reportHeading}>Financial</h2>
				<p className={styles.latestNetProfit}>
					Latest Net Profit{' '}
					{netProfitRows[0]?.amount
						? netProfitRows[0].amount
								.toLocaleString('en-US', {
									style: 'currency',
									currency: 'USD',
								})
								.split('.')[0]
						: '$0'}
				</p>
				<ResponsiveLine
					data={chartValues}
					animate
					curve="monotoneX"
					useMesh
					xScale={{ type: 'time' }}
					yScale={{ type: 'linear', min: 'auto' }}
					yFormat="$,.2f"
					enableGridY={false}
					enableSlices="x"
					margin={{ top: 40, right: 80, bottom: 40, left: 80 }}
					axisLeft={{
						legend: '$AUD',
						legendOffset: 12,
						format: (value: number) => `$${Math.floor(value / 1_000_00) / 10}m`,
					}}
					axisBottom={{
						format: '%b %d',
						legend: 'Month',
						legendOffset: -12,
					}}
					tooltip={tooltip}
					theme={theme}
				/>
			</div>
		</div>
	);
};
