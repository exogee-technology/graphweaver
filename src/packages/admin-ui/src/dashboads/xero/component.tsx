import { useQuery } from '@apollo/client';
import { ResponsiveLine } from '@nivo/line';
import { theme } from '../theme';
import { ProfitAndLossResult, PROFIT_AND_LOSS } from './graphql';
import styles from './styles.module.css';
import { tooltip } from './tooltip';

const categories = ['Net Profit', 'Total Operating Expenses', 'Gross Profit'];

export const XeroDashboard = () => {
	const { data, loading } = useQuery<ProfitAndLossResult>(PROFIT_AND_LOSS);

	if (loading) return <p>Loading...</p>;
	if (!data) return <p>Error: Missing data.</p>;

	const chartValues = categories.map((category) => ({
		id: category,
		data: data.profitAndLossRows
			.filter((row) => row.description === category)
			.map((row) => ({ x: new Date(row.date), y: row.amount })),
	}));
	const netProfitRows = data.profitAndLossRows.filter((row) => row.description === 'Net Profit');

	return (
		<div className={styles.wrapper}>
			<div className={styles.reportSection}>
				<h2 className={styles.reportHeading}>Financials</h2>
				<p className={styles.latestNetProfit}>
					Latest Net Profit{' '}
					{
						netProfitRows[0].amount
							.toLocaleString('en-US', {
								style: 'currency',
								currency: 'USD',
							})
							.split('.')[0]
					}
				</p>
				<ResponsiveLine
					data={chartValues}
					animate
					curve="monotoneX"
					useMesh
					xScale={{ type: 'time', format: '%Y-%m-%d' }}
					xFormat="time:%Y-%m-%d"
					yScale={{ type: 'linear' }}
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
