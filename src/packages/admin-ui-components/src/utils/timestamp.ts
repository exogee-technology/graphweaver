/** BigInt representation of a second */
const s = BigInt(1_000_000_000);
/** BigInt representation of a millisecond */
const ms = BigInt(1_000_000);
/** BigInt representation of a microsecond */
const us = BigInt(1_000);

/** Helper constant for calculating percentages without losing resolution */
const percentageMultiplyer = BigInt(100);

export class UnixNanoTimestamp {
	private input: number | bigint;

	constructor(input: number | bigint) {
		this.input = input;
	}

	public getBigInt(): bigint {
		return BigInt(this.input);
	}

	public static fromString(input: string): UnixNanoTimestamp {
		return new UnixNanoTimestamp(BigInt(input));
	}

	public toDate(): Date {
		return new Date(Number(this.input) / 1_000);
	}

	public toSIUnits(): {
		value: number;
		unit: 's' | 'ms' | 'μs' | 'ns';
	} {
		const bigintInput = this.getBigInt();

		if (bigintInput >= s) {
			return {
				value: Number(this.multiply(s).divide(s).getBigInt()) / Number(s),
				unit: 's',
			};
		} else if (bigintInput >= ms) {
			return {
				value: Number(this.multiply(ms).divide(ms).getBigInt()) / Number(ms),
				unit: 'ms',
			};
		} else if (bigintInput >= us) {
			return {
				value: Number(this.multiply(us).divide(us).getBigInt()) / Number(us),
				unit: 'μs',
			};
		} else {
			return {
				value: Number(bigintInput),
				unit: 'ns',
			};
		}
	}

	public calculateWidthAndOffset(
		startTimestamp: UnixNanoTimestamp,
		minTimestamp: UnixNanoTimestamp,
		maxTimestamp: UnixNanoTimestamp
	): {
		width: string;
		offset: number;
	} {
		const timespan = UnixNanoTimestamp.duration(minTimestamp, maxTimestamp).getBigInt();

		const calculatedWidth = this.multiply(percentageMultiplyer).divide(timespan).getBigInt();
		const width =
			calculatedWidth < 1 ? '1%' : calculatedWidth > 100 ? '100%' : `${calculatedWidth}%`;

		const calculatedOffset = startTimestamp
			.subtract(minTimestamp)
			.multiply(percentageMultiplyer)
			.divide(timespan)
			.getBigInt();
		const offset =
			calculatedOffset < 0
				? 0
				: calculatedWidth < 1 && calculatedOffset > 99
					? 99
					: Number(calculatedOffset);

		return { width, offset };
	}

	public static duration(from: UnixNanoTimestamp, to: UnixNanoTimestamp): UnixNanoTimestamp {
		const duration = to.getBigInt() - from.getBigInt();

		return new UnixNanoTimestamp(duration);
	}

	public subtract(another: UnixNanoTimestamp | bigint): UnixNanoTimestamp {
		const result =
			this.getBigInt() - (another instanceof UnixNanoTimestamp ? another.getBigInt() : another);
		return new UnixNanoTimestamp(result);
	}

	public divide(divisor: bigint): UnixNanoTimestamp {
		const result = this.getBigInt() / divisor;
		return new UnixNanoTimestamp(result);
	}

	public multiply(multiplier: bigint): UnixNanoTimestamp {
		const result = this.getBigInt() * multiplier;
		return new UnixNanoTimestamp(result);
	}
}
