/** BigInt representation of a second */
const s = BigInt(1_000_000);
/** BigInt representation of a millisecond */
const ms = BigInt(1_000);
/** BigInt representation of a microsecond */
const us = BigInt(1);

/** Helper constant for calculating percentages without losing resolution */
const percentageMultiplyer = BigInt(100);

export class UnixNanoTimeStamp {
	private input: number | bigint;

	constructor(input: number | bigint) {
		this.input = input;
	}

	public getBigInt(): bigint {
		return BigInt(this.input);
	}

	public static fromString(input: string): UnixNanoTimeStamp {
		return new UnixNanoTimeStamp(BigInt(input));
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
		startTimestamp: UnixNanoTimeStamp,
		minTimestamp: UnixNanoTimeStamp,
		maxTimestamp: UnixNanoTimeStamp
	): {
		width: string;
		offset: string;
	} {
		const timespan = UnixNanoTimeStamp.duration(minTimestamp, maxTimestamp).getBigInt();

		const calculatedWidth = this.multiply(percentageMultiplyer).divide(timespan).getBigInt();
		const width =
			calculatedWidth < 5 ? '5%' : calculatedWidth > 100 ? '100%' : `${calculatedWidth}%`;

		const calculatedOffset = startTimestamp
			.subtract(minTimestamp)
			.multiply(percentageMultiplyer)
			.divide(timespan)
			.getBigInt();
		const offset =
			calculatedOffset < 0
				? '0%'
				: calculatedWidth < 5 && calculatedOffset > 95
					? '95%'
					: `${calculatedOffset}%`;

		return { width, offset };
	}

	public static duration(from: UnixNanoTimeStamp, to: UnixNanoTimeStamp): UnixNanoTimeStamp {
		const duration = to.getBigInt() - from.getBigInt();

		return new UnixNanoTimeStamp(duration);
	}

	public subtract(another: UnixNanoTimeStamp | bigint): UnixNanoTimeStamp {
		const result =
			this.getBigInt() - (another instanceof UnixNanoTimeStamp ? another.getBigInt() : another);
		return new UnixNanoTimeStamp(result);
	}

	public divide(divisor: bigint): UnixNanoTimeStamp {
		const result = this.getBigInt() / divisor;
		return new UnixNanoTimeStamp(result);
	}

	public multiply(multiplier: bigint): UnixNanoTimeStamp {
		const result = this.getBigInt() * multiplier;
		return new UnixNanoTimeStamp(result);
	}
}
