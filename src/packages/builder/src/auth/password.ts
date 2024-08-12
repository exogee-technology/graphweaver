// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore This file is the only one we need for the bundle
import { argon2id } from 'hash-wasm/dist/argon2.umd.min.js';
import { argon2IdOptions } from '@exogee/graphweaver-auth';
import generatePassword from 'omgopass';

export const hashPassword = (password: string): Promise<string> =>
	argon2id({
		password,
		...argon2IdOptions,
	});

export const generateAdminPassword = async () => {
	const pwd = generatePassword();
	const hash = await hashPassword(pwd);
	const pwdString = `****** Admin Password: ${pwd} ******`;

	const paddingLineString = '*'.repeat(pwdString.length);

	console.log(hash);

	console.log(paddingLineString);
	console.log(pwdString);
	console.log(paddingLineString);
};
