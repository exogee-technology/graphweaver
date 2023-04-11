import { ConnectionManager } from '@exogee/graphweaver-mikroorm';
import { Session } from '../../entities';
import { DateTime } from 'luxon';

const secondsFromNow = (seconds: number) => DateTime.utc().plus({ seconds }).toJSDate();
const secondsAgo = (seconds: number) => DateTime.utc().minus({ seconds }).toJSDate();

export class DatabaseStore {
	private readonly findWithToken = (sessionToken: string) =>
		ConnectionManager.default.em.findOne(Session, { sessionToken, expiresAt: { $gt: new Date() } });

	public readonly get = async (key: string) => {
		const session = await this.findWithToken(key);

		return session?.value;
	};

	public readonly set = async (key: string, sessionDuration: number, value: any) => {
		const session = (await this.findWithToken(key)) || new Session();

		session.sessionToken = key;
		session.expiresAt = secondsFromNow(sessionDuration);
		session.value = value;

		await ConnectionManager.default.em.persistAndFlush(session);
	};

	public readonly delete = async (key: string) => {
		await ConnectionManager.default.em.nativeDelete(Session, { sessionToken: key });
	};

	public readonly clearExpired = async (sessionDuration: number) => {
		await ConnectionManager.default.em.nativeDelete(Session, {
			expiresAt: { $lte: new Date() },
		});
	};

	public readonly touch = async (key: string, sessionDuration: number) => {
		await ConnectionManager.default.em.nativeUpdate(
			Session,
			{ sessionToken: key },
			{ expiresAt: secondsFromNow(sessionDuration) }
		);
	};
}
