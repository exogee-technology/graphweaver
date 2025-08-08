import type { PointTooltipComponent } from '@nivo/line';
import styles from './styles.module.css';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const tooltip: PointTooltipComponent<any> = ({ point }) => {
	const date = new Date(point.data.xFormatted);

	return (
		<div className={styles.tooltipWrapper}>
			<h3>{point.seriesId as string}</h3>
			<span>
				{months[date.getMonth()]} {date.getFullYear()}
			</span>
			<span>{point.data.yFormatted}</span>
		</div>
	);
};
