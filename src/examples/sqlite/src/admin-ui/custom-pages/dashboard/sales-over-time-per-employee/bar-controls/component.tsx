import { Dispatch, SetStateAction } from 'react';
import { Checkbox, ComboBox, SelectMode } from '@exogee/graphweaver-admin-ui-components';
import { BarChartControls } from '../bar-chart/utils';
import styles from './styles.module.css';
import { ChartColorScheme } from '../../utils';

interface Props {
	controls: BarChartControls;
	setControls: Dispatch<SetStateAction<BarChartControls>>;
}

export const BarControls = (props: Props) => {
	const { controls, setControls } = props;

	const handleChange = (key: keyof BarChartControls, value: any) => {
		setControls((prevControls) => ({
			...prevControls,
			[key]: value,
		}));
	};

	return (
		<>
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
			<div className={styles.checkBoxContainer}>
				<Checkbox
					id="reverse"
					checked={controls.reverse}
					onChange={(e) => handleChange('reverse', (e.target as any).checked)}
				/>
				<label htmlFor="reverse">Reverse</label>
			</div>
			<div className={styles.checkBoxContainer}>
				<Checkbox
					id="enableLabel"
					checked={controls.enableLabel}
					onChange={(e) => handleChange('enableLabel', (e.target as any).checked)}
				/>
				<label htmlFor="enableLabel">Enable label</label>
			</div>
			<div className={styles.checkBoxContainer}>
				<Checkbox
					id="enableTotals"
					checked={controls.enableTotals}
					onChange={(e) => handleChange('enableTotals', (e.target as any).checked)}
				/>
				<label htmlFor="enableTotals">Enable totals</label>
			</div>
			<div className={styles.checkBoxContainer}>
				<Checkbox
					id="enableGridX"
					checked={controls.enableGridX}
					onChange={(e) => handleChange('enableGridX', (e.target as any).checked)}
				/>
				<label htmlFor="enableGridX">Enable grid X</label>
			</div>
			<div className={styles.checkBoxContainer}>
				<Checkbox
					id="enableGridY"
					checked={controls.enableGridY}
					onChange={(e) => handleChange('enableGridY', (e.target as any).checked)}
				/>
				<label htmlFor="enableGridY">Enable grid Y</label>
			</div>
		</>
	);
};
