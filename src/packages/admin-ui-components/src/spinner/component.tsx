// TODO: (1) sizing and placement (2) animation; see CSS
import { ReactComponent as GraphweaverSpinner } from '~/assets/graphweaver-logo-spinner.svg';
import './styles.module.css';
import styles from './styles.module.css';

export const Spinner = () => {
	return (
		<div
		//className={styles.spinner} @todo
		>
			{/* <GraphweaverSpinner /> */}
			More data...
		</div>
	);
};
