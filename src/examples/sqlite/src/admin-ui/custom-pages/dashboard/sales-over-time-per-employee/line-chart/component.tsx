import { ResponsiveLine } from '@nivo/line';
import { LineChartControls, LineChartItem } from './utils';
import { theme } from '../../utils';

interface Props {
	data: LineChartItem[];
	controls: LineChartControls;
}

export const LineChart = (props: Props) => {
	const { data, controls } = props;
	return (
		<div style={{ height: '35vh' }}>
			<ResponsiveLine
				data={data}
				colors={{ scheme: controls.colorScheme }}
				curve={controls.curve}
				enableArea={controls.enableArea}
				enablePoints={controls.enablePoints}
				enablePointLabel={controls.enablePointLabel}
				enableGridX={controls.enableGridX}
				enableGridY={controls.enableGridY}
				margin={{ top: 30, right: 150, bottom: 50, left: 60 }}
				yFormat=" >-$.2f"
				axisTop={null}
				axisRight={null}
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
					legendOffset: -40,
					legendPosition: 'middle',
					truncateTickAt: 0,
				}}
				pointColor={{ theme: 'background' }}
				pointBorderWidth={2}
				pointBorderColor={{ from: 'serieColor' }}
				pointLabelYOffset={-12}
				enableTouchCrosshair={true}
				useMesh={true}
				theme={theme}
				legends={[
					{
						anchor: 'bottom-right',
						direction: 'column',
						justify: false,
						translateX: 100,
						translateY: 0,
						itemsSpacing: 0,
						itemDirection: 'left-to-right',
						itemWidth: 80,
						itemHeight: 20,
						itemOpacity: 0.75,
						symbolSize: 12,
						symbolShape: 'circle',
						symbolBorderColor: 'rgba(0, 0, 0, .5)',
						effects: [
							{
								on: 'hover',
								style: {
									itemBackground: 'rgba(0, 0, 0, .03)',
									itemOpacity: 1,
								},
							},
						],
					},
				]}
			/>
		</div>
	);
};
