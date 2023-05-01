import classNames from 'classnames';
import styles from './styles.module.css';

export enum SpinnerSize {
	LARGE = 'LARGE',
	SMALL = 'SMALL',
}

type Props = {
	size?: SpinnerSize;
};

export const Spinner = ({ size = SpinnerSize.LARGE }: Props) => {
	return (
		<div className={classNames(styles.container, size === SpinnerSize.SMALL && styles.small)}>
			<div className={classNames(styles.wrapper, size === SpinnerSize.SMALL && styles.small)}>
				<div className={styles.loader}></div>
			</div>
		</div>
	);
};
