import { useMemo, useState } from 'react';
import classNames from 'classNames';
import { useData } from './use-data';
import { LineChart } from './line-chart';
import { BarChart } from './bar-chart';
import { defaultLineChartControls } from './line-chart/utils';
import { defaultBarChartControls } from './bar-chart/utils';
import { LineControls } from './line-controls';
import { BarControls } from './bar-controls';
import styles from './styles.module.css';

export const SalesOverTimePerEmployee = () => {
	const [chartType, setChartType] = useState<'line' | 'bar'>('bar');
	const { employeeIds, dates, lineData, barData, loading, error } = useData();
	const [lineControls, setLineControls] = useState(defaultLineChartControls);
	const [barControls, setBarControls] = useState(defaultBarChartControls);
	const [datesRange, setDatesRange] = useState(15);

	const lineDataRange = useMemo(() => {
		if (chartType === 'bar') return [];

		return lineData.map((dataItem) => {
			const dataItemCopy = { ...dataItem };
			dataItemCopy.data = dataItem.data.slice(0, datesRange);
			return dataItemCopy;
		});
	}, [lineData, datesRange, chartType]);

	const barDataRange = useMemo(() => {
		if (chartType === 'line') return [];

		return barData.slice(0, datesRange);
	}, [barData, datesRange, chartType]);

	if (loading) return <p>Loading...</p>;
	if (error) return <p>Error: {error.message}</p>;

	const lineClassName = classNames(styles.buttonLine, { [styles.active]: chartType === 'line' });
	const barClassName = classNames(styles.buttonBar, { [styles.active]: chartType === 'bar' });

	return (
		<div className={styles.container}>
			<div className={styles.controlsContainer}>
				<div className={styles.chartType}>
					<button className={lineClassName} onClick={() => setChartType('line')}>
						Line
					</button>
					<button className={barClassName} onClick={() => setChartType('bar')}>
						Bar
					</button>
				</div>
				<div>
					<label>Data points: </label>
					<input
						className={styles.rangeInput}
						type="range"
						min={0}
						max={dates.length - 1}
						value={datesRange}
						onChange={(e) => setDatesRange(parseInt(e.target.value))}
					/>
				</div>

				{chartType === 'line' ? (
					<LineControls controls={lineControls} setControls={setLineControls} />
				) : (
					<BarControls controls={barControls} setControls={setBarControls} />
				)}
			</div>
			<div className={styles.chartContainer}>
				{chartType === 'line' ? (
					<LineChart data={lineDataRange} controls={lineControls} />
				) : (
					<BarChart data={barDataRange} controls={barControls} employeeIds={employeeIds} />
				)}
			</div>
		</div>
	);
};
