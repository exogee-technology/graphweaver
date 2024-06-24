import { useMemo } from 'react';
import styles from './styles.module.css';
import { LargeStar } from './large-star';
import { SmallStar } from './small-star';

const randomNumber = (min: number, max: number) => {
	return Math.floor(Math.random() * (max - min + 1)) + min;
};

const numberOfStars = 100;

const starStyle = (radius: number) => ({
	top: `${randomNumber(0, 100)}%`,
	left: `${randomNumber(0, 100)}%`,
	width: radius,
	height: radius,
	animationDuration: `${randomNumber(6, 16)}s`,
});

export const StarField = () => {
	const stars = useMemo(() => {
		const result = [];
		for (let i = 0; i < numberOfStars; i++) {
			if (i % 18 === 0) {
				// Large stars
				result.push(
					<LargeStar key={i} className={styles.star} style={starStyle(randomNumber(30, 80))} />
				);
			} else {
				// Small stars
				result.push(
					<SmallStar key={i} className={styles.star} style={starStyle(randomNumber(5, 12))} />
				);
			}
		}

		return result;
	}, []);

	return <div className={styles.space}>{stars}</div>;
};
