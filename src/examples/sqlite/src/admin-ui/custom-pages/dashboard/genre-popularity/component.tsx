import { useMemo, useState } from 'react';
import { ResponsivePie } from '@nivo/pie';
import { Checkbox, ComboBox, SelectMode } from '@exogee/graphweaver-admin-ui-components';
import { ChartColorScheme, theme } from '../utils';
import { useGenrePopularityQuery } from './graphql.generated';
import { defaultPieChartControls, getPieData, PieChartControls } from './utils';
import styles from './styles.module.css';

export const GenrePopularity = () => {
	const { data: queryData, loading, error } = useGenrePopularityQuery();
	const [controls, setControls] = useState(defaultPieChartControls);
	const [genresRange, setGenresRange] = useState(10);

	const data = useMemo(() => getPieData(queryData), [queryData]);

	const rangeData = useMemo(() => data.slice(0, genresRange), [data, genresRange]);

	if (loading) return <p>Loading...</p>;
	if (error) return <p>Error: {error.message}</p>;

	const handleChange = (key: keyof PieChartControls, value: any) => {
		setControls((prevControls) => ({
			...prevControls,
			[key]: value,
		}));
	};

	return (
		<div className={styles.container}>
			<div className={styles.controlsContainer}>
				<div className={styles.controlItem}>
					<label>Data points: </label>
					<input
						className={styles.rangeInput}
						type="range"
						min={0}
						max={data.length - 1}
						value={genresRange}
						onChange={(e) => setGenresRange(parseInt(e.target.value))}
					/>
				</div>
				<div className={styles.controlItem}>
					<label>Color scheme: </label>
					<ComboBox
						mode={SelectMode.SINGLE}
						options={Object.values(ChartColorScheme).map((value) => ({ value, label: value }))}
						onChange={(selected) => handleChange('colorScheme', selected[0].value)}
						value={{ value: controls.colorScheme }}
						placeholder="Select"
					/>
				</div>
				<div className={styles.controlItem}>
					<label>Angle: </label>
					<input
						className={styles.rangeInput}
						type="range"
						min={0}
						max={360}
						value={controls.angle}
						onChange={(e) => handleChange('angle', parseInt(e.target.value))}
					/>
				</div>
				<div className={styles.controlItem}>
					<label>Inner radius: </label>
					<input
						className={styles.rangeInput}
						type="range"
						min={0}
						max={95}
						value={controls.innerRadius * 100}
						onChange={(e) => handleChange('innerRadius', parseInt(e.target.value) / 100)}
					/>
				</div>
				<div className={styles.controlItem}>
					<label>Pad angle: </label>
					<input
						className={styles.rangeInput}
						type="range"
						min={0}
						max={45}
						value={controls.padAngle}
						onChange={(e) => handleChange('padAngle', parseInt(e.target.value))}
					/>
				</div>
				<div className={styles.controlItem}>
					<label>Corner radius: </label>
					<input
						className={styles.rangeInput}
						type="range"
						min={0}
						max={45}
						value={controls.cornerRadius}
						onChange={(e) => handleChange('cornerRadius', parseInt(e.target.value))}
					/>
				</div>
				<div className={styles.checkBoxContainer}>
					<Checkbox
						id="sortByValue"
						checked={controls.sortByValue}
						onChange={(e) => handleChange('sortByValue', (e.target as any).checked)}
					/>
					<label htmlFor="sortByValue">Sort by value</label>
				</div>
				<div className={styles.checkBoxContainer}>
					<Checkbox
						id="enableArcLabels"
						checked={controls.enableArcLabels}
						onChange={(e) => handleChange('enableArcLabels', (e.target as any).checked)}
					/>
					<label htmlFor="enableArcLabels">Enable arc labels</label>
				</div>
				<div className={styles.checkBoxContainer}>
					<Checkbox
						id="enableArcLinkLabels"
						checked={controls.enableArcLinkLabels}
						onChange={(e) => handleChange('enableArcLinkLabels', (e.target as any).checked)}
					/>
					<label htmlFor="enableArcLinkLabels">Enable arc link labels</label>
				</div>
			</div>
			<div className={styles.chartContainer}>
				<ResponsivePie
					data={rangeData}
					margin={{ top: 30, right: 150, bottom: 70, left: 60 }}
					theme={theme}
					colors={{ scheme: controls.colorScheme }}
					startAngle={controls.angle}
					innerRadius={controls.innerRadius}
					padAngle={controls.padAngle}
					cornerRadius={controls.cornerRadius}
					sortByValue={controls.sortByValue}
					enableArcLabels={controls.enableArcLabels}
					enableArcLinkLabels={controls.enableArcLinkLabels}
					activeOuterRadiusOffset={8}
					borderWidth={1}
					animate
					borderColor={{
						from: 'color',
						modifiers: [['darker', 0.2]],
					}}
					arcLinkLabelsSkipAngle={10}
					arcLinkLabelsThickness={2}
					arcLinkLabelsColor={{ from: 'color' }}
					arcLinkLabel="label"
					arcLabelsSkipAngle={10}
					arcLabelsTextColor={{
						from: 'color',
						modifiers: [['darker', 2]],
					}}
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
		</div>
	);
};
