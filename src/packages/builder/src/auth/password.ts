import { hashPassword } from '@exogee/graphweaver-auth';
import generatePassword from 'omgopass';

export const generateAdminPassword = async () => {
	const pwd = generatePassword();
	const hash = await hashPassword(pwd);
	const pwdString = `****** Admin Password: ${pwd} ******`;

	const paddingLineString = '*'.repeat(pwdString.length);

	console.log(hash);

	console.log(`\n\n${paddingLineString}`);
	console.log(pwdString);
	console.log(`${paddingLineString}\n`);
};
