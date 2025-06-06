import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Filter } from '../../utils';
import { getNumberOrUndefined, isDefined } from './utils';
import { CloseButtonIcon } from '../../assets';
import { Button } from '../../button';
import { Input } from '../../input';
import styles from './styles.module.css';

interface Props {
	fieldName: string;
	entity: string; // Unused but defined for a consistent API
	onChange?: (fieldName: string, newFilter: Filter) => void;
	filter?: Filter;
}

export const NumericRangeFilter = ({ fieldName, onChange, filter }: Props) => {
	const startKey = `${fieldName}_gte`;
	const endKey = `${fieldName}_lte`;
	const from = getNumberOrUndefined(filter?.[startKey] ?? filter?.[fieldName]);
	const to = getNumberOrUndefined(filter?.[endKey]);
	const [isOpen, setIsOpen] = useState(false);
	const popUpRef = useRef<HTMLDivElement>(null);

	/**
	 * Note: don't rely on closure values for `from`, `to` as we sometimes set these values and immediately call `handleOnChange`
	 * React setState is async and the values might not be updated yet, so we are shadowing the state values with passed arguments
	 * */
	const handleOnChange = (from: unknown, to: unknown) => {
		from = getNumberOrUndefined(from);
		to = getNumberOrUndefined(to);

		onChange?.(fieldName, {
			[startKey]: from,
			[endKey]: to,
			[fieldName]: undefined,
		});
	};

	const clear = () => {
		handleOnChange(undefined, undefined);
		setIsOpen(false);
	};

	const displayText = () => {
		if (isDefined(from) || isDefined(to)) {
			if (isDefined(from) && isDefined(to)) {
				return `${from} - ${to}`;
			} else if (isDefined(from)) {
				return `>= ${from}`;
			} else {
				return `<= ${to}`;
			}
		}

		return from ?? fieldName;
	};

	useEffect(() => {
		const handleOutsideClick = (event: MouseEvent) => {
			if (popUpRef.current && !popUpRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};

		document.addEventListener('mousedown', handleOutsideClick);

		return () => {
			document.removeEventListener('mousedown', handleOutsideClick);
		};
	}, []);

	return (
		<div className={styles.container}>
			<div className={styles.inputSelector}>
				<div
					className={clsx(from && styles.inputFieldActive, styles.inputField)}
					onClick={() => setIsOpen((isOpen) => !isOpen)}
				>
					{displayText()}
				</div>
				{from && (
					<div className={styles.indicatorWrapper}>
						<span className={styles.indicatorSeparator}></span>
						<div className={styles.indicatorContainer}>
							<CloseButtonIcon className={styles.closeIcon} onClick={clear} />
						</div>
					</div>
				)}
			</div>
			{isOpen && (
				<div className={styles.popup} ref={popUpRef}>
					<div className={styles.inputContainer}>
						<Input
							type="number"
							fieldName="from"
							value={`${from ?? ''}`}
							onChange={(value: unknown) => handleOnChange(value, to)}
							className={styles.input}
						/>
						<span>-</span>
						<Input
							type="number"
							fieldName="to"
							value={`${to ?? ''}`}
							onChange={(value: unknown) => handleOnChange(from, value)}
							className={styles.input}
						/>
					</div>

					<div className={styles.filterButtons}>
						<Button type="button" className={styles.finishButton} onClick={() => setIsOpen(false)}>
							Done
						</Button>
						<Button type="reset" className={styles.clearButton} onClick={clear}>
							Clear
						</Button>
					</div>
				</div>
			)}
		</div>
	);
};
