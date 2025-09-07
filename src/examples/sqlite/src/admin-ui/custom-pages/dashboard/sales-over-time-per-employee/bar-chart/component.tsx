import { ResponsiveBar } from '@nivo/bar';
import { theme } from '../../utils';
import { BarChartControls, BarChartItem } from './utils';

interface Props {
	employeeIds: string[];
	data: BarChartItem[];
	controls: BarChartControls;
}

export const BarChart = (props: Props) => {
	const { data, controls, employeeIds } = props;

	// Apply reverse if needed
	const chartData = controls.reverse ? [...data].reverse() : data;

	return (
		<div style={{ height: '40vh' }}>
			<ResponsiveBar
				data={chartData}
				keys={employeeIds}
				colors={{ scheme: controls.colorScheme }}
				enableLabel={controls.enableLabel}
				enableTotals={controls.enableTotals}
				enableGridX={controls.enableGridX}
				enableGridY={controls.enableGridY}
				indexBy="date"
				margin={{ top: 30, right: 150, bottom: 50, left: 60 }}
				padding={0.3}
				valueScale={{ type: 'linear' }}
				valueFormat=" >-$.2f"
				indexScale={{ type: 'band', round: true }}
				theme={theme}
				axisBottom={{
					tickSize: 5,
					tickPadding: 5,
					tickRotation: 90,
					truncateTickAt: 0,
				}}
				axisLeft={{
					tickSize: 5,
					tickPadding: 5,
					tickRotation: 0,
					legend: 'Sales ($)',
					legendPosition: 'middle',
					legendOffset: -40,
					truncateTickAt: 0,
				}}
				labelSkipWidth={12}
				labelSkipHeight={12}
				labelTextColor={{
					from: 'color',
					modifiers: [['darker', 1.6]],
				}}
				legends={[
					{
						dataFrom: 'keys',
						anchor: 'bottom-right',
						direction: 'column',
						justify: false,
						translateX: 120,
						translateY: 0,
						itemsSpacing: 2,
						itemWidth: 100,
						itemHeight: 20,
						itemDirection: 'left-to-right',
						itemOpacity: 0.85,
						symbolSize: 20,
						effects: [
							{
								on: 'hover',
								style: {
									itemOpacity: 1,
								},
							},
						],
					},
				]}
				role="application"
				ariaLabel="Sales per employee over time"
			/>
		</div>
	);
};
