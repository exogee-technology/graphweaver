import React from 'react';
import { Await, useLoaderData } from 'react-router-dom';
import { Decimal } from 'decimal.js';
import { ResponsiveAreaBump } from '@nivo/bump';
import { ResponsiveLine } from '@nivo/line';
import { Loader } from '@exogee/graphweaver-admin-ui-components';
import { theme } from '../theme';
import { LoaderData, ProfitAndLossRow } from './graphql';
import styles from './styles.module.css';
import { netProfitTooltip } from './tooltips';

type TenantNetProfitData = {
	id: string;
	data: { x: Date; y: number }[];
};

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthString = (date: Date) => `${months[date.getMonth()]} ${date.getFullYear()}`;

export const AllCompanies = () => {
	const data = useLoaderData() as { rows: ProfitAndLossRow[] };

	return (
		<React.Suspense fallback={<Loader />}>
			<Await resolve={data.rows} errorElement={<p>Error loading report rows!</p>}>
				{(result: LoaderData) => {
					const { profitAndLossRows } = result.data;

					// Net Profit calculation
					const tenantNetProfitMap = new Map<string, TenantNetProfitData>();
					for (const row of profitAndLossRows) {
						// Net profit map per tenant
						if (!tenantNetProfitMap.has(row.tenant.id)) {
							tenantNetProfitMap.set(row.tenant.id, { id: row.tenant.tenantName, data: [] });
						}
						tenantNetProfitMap
							.get(row.tenant.id)
							?.data.push({ x: new Date(row.date), y: row.amount });
					}

					// Ranking
					const rankingData = [...tenantNetProfitMap.values()].map((record) => ({
						...record,
						data: record.data.reverse().map(({ x, y }) => ({ x: monthString(x), y })),
					}));
					rankingData.push({
						id: 'Baseline',
						data: rankingData[0].data.map(({ x }) => ({ x, y: 0 })),
					});

					// Cumulative Net Profit
					const totalsByCompany: { [companyName: string]: number } = {};
					const cumulativeNetProfit = [...tenantNetProfitMap.values()].map((value) => {
						let currentTotal = new Decimal(0);
						const newRecord = {
							id: value.id,
							data: value.data.map(({ x, y }) => {
								const newPoint = {
									x,
									y: new Decimal(y).add(currentTotal).toNumber(),
								};
								currentTotal = currentTotal.plus(y);
								return newPoint;
							}),
						};

						totalsByCompany[value.id] = currentTotal.toNumber();

						return newRecord;
					});

					let overallTotal = 0;

					return (
						<div className={styles.wrapper}>
							<div className={styles.reportSection}>
								<h2 className={styles.reportHeading}>Net Profit for Last 12 Months</h2>
								<div className={styles.totalNetProfitCardRow}>
									{Object.entries(totalsByCompany)
										.sort(([left], [right]) => left.localeCompare(right))
										.map(([company, total]) => {
											overallTotal += total;
											return (
												<div key={company} className={styles.totalNetProfitCard}>
													<span className={styles.totalNetProfitCardCompanyName}>{company}</span>
													<span className={styles.totalNetProfitCardAmount}>
														{total.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
													</span>
												</div>
											);
										})}

									<div className={styles.totalNetProfitCard}>
										<span className={styles.totalNetProfitCardCompanyName}>All Companies</span>
										<span className={styles.totalNetProfitCardAmount}>
											{overallTotal.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
										</span>
									</div>
								</div>

								<h2 className={styles.reportHeading}>Ranking</h2>
								<ResponsiveAreaBump
									data={rankingData}
									axisTop={{
										tickSize: 5,
										tickPadding: 5,
										tickRotation: 0,
										legend: '',
										legendPosition: 'middle',
										legendOffset: -36,
									}}
									axisBottom={{
										tickSize: 5,
										tickPadding: 5,
										tickRotation: 0,
										legend: '',
										legendPosition: 'middle',
										legendOffset: 32,
									}}
									margin={{ top: 40, right: 100, bottom: 40, left: 60 }}
									theme={theme}
								/>

								<h2 className={styles.reportHeading}>Net Profit</h2>
								<ResponsiveLine
									data={[...tenantNetProfitMap.values()]}
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
										format: (value: Date) => monthString(value),
										legend: 'Month',
										legendOffset: -12,
									}}
									tooltip={netProfitTooltip}
									theme={theme}
								/>

								<h2 className={styles.reportHeading}>Cumulative Net Profit</h2>
								<ResponsiveLine
									data={cumulativeNetProfit}
									animate
									curve="monotoneX"
									useMesh
									enableArea
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
										format: (value: Date) => monthString(value),
										legend: 'Month',
										legendOffset: -12,
									}}
									tooltip={netProfitTooltip}
									theme={theme}
								/>
							</div>
						</div>
					);
				}}
			</Await>
		</React.Suspense>
	);
};
