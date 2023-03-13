import { create, RandomSeed } from 'random-seed';
import * as uuid from 'uuid';
import * as crypto from 'crypto';

/**
 * Singleton ID generator class.
 * Uses random-seed to generate a 15-char sequence of pseudo-random printable chars,
 * then uses the aguid() function to convert that to a deterministic UUID (v4).
 * If the generator is reinitialized with the value 'true', it will re-seed with
 * the fixed seed so that the sequence is replicable.
 */
export class IdGenerator {
	private static instance: IdGenerator;
	private readonly seed = 'Graphweaver fixed seed';
	private strlen = 15;
	private readonly rand = create(this.seed);

	public static init = (reinitialize?: boolean): IdGenerator => {
		if (!this.instance || reinitialize) {
			this.instance = new this();
		}
		return this.instance;
	};

	public static getId = () => aguid(this.instance.rand.string(this.instance.strlen));
}

// This is actually scraped/converted to TS from https://github.com/dwyl/aguid - I don't like this but
// there's no typescript definition for aguid (whereas there are for uuid and crypto).
const aguid = (str?: string): string => {
	if (!str || str.length < 1) {
		// no parameter supplied
		return uuid.v4(); // return node-uuid v4() uuid
	} else {
		// create a consistent (non-random!) UUID
		const hash = crypto.createHash('sha256').update(str.toString()).digest('hex').substring(0, 36);
		const chars = hash.split('');
		chars[8] = '-';
		chars[13] = '-';
		chars[14] = '4';
		chars[18] = '-';
		chars[19] = '8';
		chars[23] = '-';
		return chars.join('');
	}
};
